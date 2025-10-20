const express = require('express');
const pool = require('../db/index');
const authenticateToken = require('../middleware/auth');
const { generateTransactionId, generateReferenceNumber } = require('./transactions');
const cron = require('node-cron');

const router = express.Router();

// Generate unique FD ID: FD-[5-digit sequence]
async function generateFDId(client = pool) {
  const prefix = 'FD';

  const result = await client.query(
    `SELECT fd_id FROM fixed_deposit 
     WHERE fd_id LIKE $1
     ORDER BY fd_id DESC LIMIT 1`,
    [`${prefix}-%`]
  );

  let sequence = 1;
  if (result.rows.length > 0) {
    const lastId = result.rows[0].fd_id;
    const lastSeq = parseInt(lastId.split('-')[1]);
    sequence = lastSeq + 1;
  }

  return `${prefix}-${sequence.toString().padStart(5, '0')}`;
}

// Get FD interest rate based on term
function getFDInterestRate(term) {
  const rates = {
    '0.5': 13.0,  // 6 months
    '1': 14.0,    // 1 year
    '3': 15.0     // 3 years
  };
  return rates[term] || null;
}

// Calculate maturity date
function calculateMaturityDate(startDate, termYears) {
  const maturityDate = new Date(startDate);
  const months = parseFloat(termYears) * 12;
  maturityDate.setMonth(maturityDate.getMonth() + months);
  return maturityDate.toISOString().split('T')[0];
}

// Calculate monthly interest amount
function calculateMonthlyInterest(principal, annualRate) {
  return (principal * (annualRate / 100)) / 12;
}

// Check account eligibility and get holders
router.get('/check-account/:accountId', authenticateToken, async (req, res) => {
  const { accountId } = req.params;

  try {
    // Verify account exists and is active
    const accountResult = await pool.query(
      `SELECT a.account_id, a.current_balance, a.status, a.account_type_id, at.account_type_name
       FROM account a
       JOIN account_type at ON a.account_type_id = at.account_type_id
       WHERE a.account_id = $1`,
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = accountResult.rows[0];

    if (account.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Account is not active' });
    }

    // Check if account type is eligible for FD
    const eligibleTypes = ['ADULT', 'TEEN', 'SENIOR', 'JOINT'];
    const accountTypeName = account.account_type_name.toUpperCase();
    
    const isEligible = eligibleTypes.some(type => accountTypeName.includes(type));
    
    if (!isEligible) {
      return res.status(400).json({ 
        error: 'This account type is not eligible for Fixed Deposits. Only Adult, Teen, Senior, and Joint accounts can open FDs.' 
      });
    }

    // Check if account already has an active FD
    const existingFDResult = await pool.query(
      `SELECT fd_id FROM fixed_deposit 
       WHERE account_id = $1 AND status = 'ACTIVE'`,
      [accountId]
    );

    if (existingFDResult.rows.length > 0) {
      return res.status(400).json({ 
        error: `This account already has an active Fixed Deposit (${existingFDResult.rows[0].fd_id}). Only one FD per account is allowed.` 
      });
    }

    // Get account holders
    const holdersResult = await pool.query(
      `SELECT c.customer_id, c.first_name, c.last_name, c.nic_number
       FROM account_holder ah
       JOIN customer c ON ah.customer_id = c.customer_id
       WHERE ah.account_id = $1
       ORDER BY ah.created_at ASC`,
      [accountId]
    );

    res.json({
      account_id: accountId,
      account_type: account.account_type_name,
      current_balance: account.current_balance,
      holders: holdersResult.rows
    });
  } catch (err) {
    console.error('Error checking account:', err);
    res.status(500).json({ error: 'Failed to check account' });
  }
});

// Search Fixed Deposits
router.get('/search', authenticateToken, async (req, res) => {
  const { fdNumber, accountNumber, customerName, filterType } = req.query;
  const agentId = req.user.employee_id;

  try {
    let query = `
      SELECT 
        fd.fd_id,
        fd.account_id,
        fd.fd_type,
        fd.amount,
        fd.interest_rate,
        fd.start_date,
        fd.maturity_date,
        fd.status,
        a.current_balance as account_balance,
        at.account_type_name,
        c.customer_id,
        c.first_name,
        c.last_name,
        c.nic_number
      FROM fixed_deposit fd
      JOIN account a ON fd.account_id = a.account_id
      JOIN account_type at ON a.account_type_id = at.account_type_id
      JOIN account_holder ah ON a.account_id = ah.account_id
      JOIN customer c ON ah.customer_id = c.customer_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Apply filter type
    if (filterType) {
      if (filterType === 'ACTIVE' || filterType === 'MATURED' || filterType === 'CLOSED') {
        query += ` AND fd.status = $${paramIndex}`;
        params.push(filterType);
        paramIndex++;
      } else if (filterType === '6_MONTHS' || filterType === '1_YEAR' || filterType === '3_YEARS') {
        query += ` AND fd.fd_type = $${paramIndex}`;
        params.push(filterType);
        paramIndex++;
      } else if (filterType === 'processed_by_me') {
        query += ` AND c.agent_id = $${paramIndex}`;
        params.push(agentId);
        paramIndex++;
      }
    }

    if (fdNumber) {
      query += ` AND fd.fd_id = $${paramIndex}`;
      params.push(fdNumber);
      paramIndex++;
    }

    if (accountNumber) {
      query += ` AND fd.account_id = $${paramIndex}`;
      params.push(accountNumber);
      paramIndex++;
    }

    if (customerName) {
      query += ` AND EXISTS (
        SELECT 1 FROM account_holder ah2
        JOIN customer c2 ON ah2.customer_id = c2.customer_id
        WHERE ah2.account_id = a.account_id
        AND (LOWER(c2.first_name) LIKE LOWER($${paramIndex}) OR LOWER(c2.last_name) LIKE LOWER($${paramIndex}))
      )`;
      params.push(`%${customerName}%`);
      paramIndex++;
    }

    query += ' ORDER BY fd.start_date DESC';

    const result = await pool.query(query, params);

    // Calculate additional info for each FD
    const fdsWithDetails = await Promise.all(result.rows.map(async (fd) => {
      const today = new Date();
      const maturityDate = new Date(fd.maturity_date);
      const daysToMaturity = Math.ceil((maturityDate - today) / (1000 * 60 * 60 * 24));
      
      // Get last interest payment for THIS specific FD
      const lastInterestResult = await pool.query(
        `SELECT time_date_stamp, amount
         FROM transaction
         WHERE account_id = $1 
         AND transaction_type = 'FD_INTEREST'
         AND description LIKE $2
         ORDER BY time_date_stamp DESC
         LIMIT 1`,
        [fd.account_id, `%${fd.fd_id}%`]
      );

      // Get total count of interest payments for THIS specific FD
      const countResult = await pool.query(
        `SELECT COUNT(*) as total_interests_paid
        FROM transaction
        WHERE account_id = $1 
        AND transaction_type = 'FD_INTEREST'
        AND description LIKE $2`,
        [fd.account_id, `%${fd.fd_id}%`]
      );

      // Get total amount of interest payments for THIS specific FD
      const sumResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total_interest_paid_amount
        FROM transaction
        WHERE account_id = $1 
        AND transaction_type = 'FD_INTEREST'
        AND description LIKE $2`,
        [fd.account_id, `%${fd.fd_id}%`]
      );

      const totalInterestPaid = parseFloat(sumResult.rows[0].total_interest_paid_amount);
      const currentValue = parseFloat(fd.amount) + totalInterestPaid;

      return {
        ...fd,
        days_to_maturity: daysToMaturity > 0 ? daysToMaturity : 0,
        current_value: currentValue.toFixed(2),
        monthly_interest: calculateMonthlyInterest(parseFloat(fd.amount), parseFloat(fd.interest_rate)).toFixed(2),
        customer_name: `${fd.first_name} ${fd.last_name}`,
        last_interest_paid: lastInterestResult.rows.length > 0 ? lastInterestResult.rows[0].time_date_stamp : null,
        last_interest_amount: lastInterestResult.rows.length > 0 ? lastInterestResult.rows[0].amount : null,
        total_interests_paid: parseInt(countResult.rows[0].total_interests_paid),
        total_interest_paid_amount: sumResult.rows[0].total_interest_paid_amount.toString()
      };
    }));

    res.json(fdsWithDetails);
  } catch (err) {
    console.error('Error searching FDs:', err);
    res.status(500).json({ error: 'Failed to search fixed deposits' });
  }
});

// Get FD by ID
router.get('/:fdId', authenticateToken, async (req, res) => {
  const { fdId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        fd.fd_id,
        fd.account_id,
        fd.fd_type,
        fd.amount,
        fd.interest_rate,
        fd.start_date,
        fd.maturity_date,
        fd.status,
        a.current_balance as account_balance,
        at.account_type_name,
        c.customer_id,
        c.first_name,
        c.last_name,
        c.nic_number,
        c.phone_number,
        c.email
      FROM fixed_deposit fd
      JOIN account a ON fd.account_id = a.account_id
      JOIN account_type at ON a.account_type_id = at.account_type_id
      JOIN account_holder ah ON a.account_id = ah.account_id
      JOIN customer c ON ah.customer_id = c.customer_id
      WHERE fd.fd_id = $1`,
      [fdId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fixed deposit not found' });
    }

    // Group customer names for single FD
    const fd = result.rows[0];
    const customerNames = result.rows.map(row => `${row.first_name} ${row.last_name}`).join(', ');

    const today = new Date();
    const maturityDate = new Date(fd.maturity_date);
    const daysToMaturity = Math.ceil((maturityDate - today) / (1000 * 60 * 60 * 24));
    
    // Get last interest payment for THIS specific FD
    const lastInterestResult = await pool.query(
      `SELECT time_date_stamp, amount
       FROM transaction
       WHERE account_id = $1 
       AND transaction_type = 'FD_INTEREST'
       AND description LIKE $2
       ORDER BY time_date_stamp DESC
       LIMIT 1`,
      [fd.account_id, `%${fdId}%`]
    );

    // Get total count of interest payments for THIS specific FD
    const countResult = await pool.query(
      `SELECT COUNT(*) as total_interests_paid
      FROM transaction
      WHERE account_id = $1 
      AND transaction_type = 'FD_INTEREST'
      AND description LIKE $2`,
      [fd.account_id, `%${fdId}%`]
    );

    // Get total amount of interest payments for THIS specific FD
    const sumResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_interest_paid_amount
      FROM transaction
      WHERE account_id = $1 
      AND transaction_type = 'FD_INTEREST'
      AND description LIKE $2`,
      [fd.account_id, `%${fdId}%`]
    );

    const totalInterestPaid = parseFloat(sumResult.rows[0].total_interest_paid_amount);
    const currentValue = parseFloat(fd.amount) + totalInterestPaid;

    const fdWithDetails = {
      ...fd,
      days_to_maturity: daysToMaturity > 0 ? daysToMaturity : 0,
      current_value: currentValue.toFixed(2),
      monthly_interest: calculateMonthlyInterest(parseFloat(fd.amount), parseFloat(fd.interest_rate)).toFixed(2),
      customer_name: customerNames,
      last_interest_paid: lastInterestResult.rows.length > 0 ? lastInterestResult.rows[0].time_date_stamp : null,
      last_interest_amount: lastInterestResult.rows.length > 0 ? lastInterestResult.rows[0].amount : null,
      total_interests_paid: parseInt(countResult.rows[0].total_interests_paid),
      total_interest_paid_amount: sumResult.rows[0].total_interest_paid_amount.toString()
    };

    res.json(fdWithDetails);
  } catch (err) {
    console.error('Error fetching FD:', err);
    res.status(500).json({ error: 'Failed to fetch fixed deposit details' });
  }
});

// Create new Fixed Deposit
router.post('/create', authenticateToken, async (req, res) => {
  const { accountId, amount, term } = req.body;
  const employeeId = req.user.employee_id;

  if (!accountId || !amount || !term) {
    return res.status(400).json({ error: 'Account ID, amount, and term are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify account exists and is active
    const accountResult = await client.query(
      `SELECT a.account_id, a.current_balance, a.status, a.account_type_id, at.account_type_name
       FROM account a
       JOIN account_type at ON a.account_type_id = at.account_type_id
       WHERE a.account_id = $1`,
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      throw new Error('Account not found');
    }

    const account = accountResult.rows[0];

    if (account.status !== 'ACTIVE') {
      throw new Error('Account is not active');
    }

    // Check if account type is eligible for FD (ADULT, TEEN, SENIOR, JOINT)
    const eligibleTypes = ['ADULT', 'TEEN', 'SENIOR', 'JOINT'];
    const accountTypeName = account.account_type_name.toUpperCase();
    
    const isEligible = eligibleTypes.some(type => accountTypeName.includes(type));
    
    if (!isEligible) {
      throw new Error('This account type is not eligible for Fixed Deposits. Only Adult, Teen, Senior, and Joint accounts can open FDs.');
    }

    // Check if account already has an FD
    const existingFDResult = await client.query(
      `SELECT fd_id FROM fixed_deposit 
       WHERE account_id = $1 AND status = 'ACTIVE'`,
      [accountId]
    );

    if (existingFDResult.rows.length > 0) {
      throw new Error('This account already has an active Fixed Deposit. Only one FD per account is allowed.');
    }

    // Validate amount
    const fdAmount = parseFloat(amount);
    if (fdAmount <= 0) {
      throw new Error('FD amount must be greater than zero');
    }

    // Check if account has sufficient balance
    const currentBalance = parseFloat(account.current_balance);
    if (currentBalance < fdAmount) {
      throw new Error(`Insufficient balance. Current balance: LKR ${currentBalance.toFixed(2)}`);
    }

    // Get interest rate for the term
    const interestRate = getFDInterestRate(term);
    if (!interestRate) {
      throw new Error('Invalid term selected');
    }

    // Generate FD ID
    const fdId = await generateFDId(client);

    // Calculate dates
    const startDate = new Date().toISOString().split('T')[0];
    const maturityDate = calculateMaturityDate(startDate, term);

    // Determine FD type based on term
    let fdType;
    if (term === '0.5') fdType = '6_MONTHS';
    else if (term === '1') fdType = '1_YEAR';
    else if (term === '3') fdType = '3_YEARS';

    // Create Fixed Deposit
    await client.query(
      `INSERT INTO fixed_deposit (
        fd_id, account_id, fd_type, amount, interest_rate,
        start_date, maturity_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')`,
      [fdId, accountId, fdType, fdAmount, interestRate, startDate, maturityDate]
    );

    // Use record_withdrawal function to deduct amount from savings account
    const withdrawalResult = await client.query(
      'SELECT * FROM record_withdrawal($1, $2, $3, $4, $5)',
      [accountId, fdAmount, `Fixed Deposit opened - ${fdId}`, 'WITHDRAWAL', employeeId]
    );

    const transaction = withdrawalResult.rows[0];

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Fixed Deposit created successfully',
      fd: {
        fd_id: fdId,
        account_id: accountId,
        fd_type: fdType,
        amount: fdAmount,
        interest_rate: interestRate,
        start_date: startDate,
        maturity_date: maturityDate,
        status: 'ACTIVE',
        monthly_interest: calculateMonthlyInterest(fdAmount, interestRate).toFixed(2)
      },
      transaction: {
        transaction_id: transaction.transaction_id,
        reference_number: transaction.reference_number
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating FD:', err);
    res.status(400).json({ error: err.message || 'Failed to create fixed deposit' });
  } finally {
    client.release();
  }
});

// Renew Fixed Deposit
router.post('/renew/:fdId', authenticateToken, async (req, res) => {
  const { fdId } = req.params;
  const { term } = req.body;
  const employeeId = req.user.employee_id;

  if (!term) {
    return res.status(400).json({ error: 'Term is required for renewal' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get FD details
    const fdResult = await client.query(
      `SELECT fd.*, a.current_balance
       FROM fixed_deposit fd
       JOIN account a ON fd.account_id = a.account_id
       WHERE fd.fd_id = $1`,
      [fdId]
    );

    if (fdResult.rows.length === 0) {
      throw new Error('Fixed Deposit not found');
    }

    const oldFd = fdResult.rows[0];

    // Close old FD
    await client.query(
      `UPDATE fixed_deposit SET status = 'MATURED'
       WHERE fd_id = $1`,
      [fdId]
    );

    // Calculate new FD details
    const interestRate = getFDInterestRate(term);
    if (!interestRate) {
      throw new Error('Invalid term selected');
    }

    const newFdId = await generateFDId(client);
    const startDate = new Date().toISOString().split('T')[0];
    const maturityDate = calculateMaturityDate(startDate, term);

    let fdType;
    if (term === '0.5') fdType = '6_MONTHS';
    else if (term === '1') fdType = '1_YEAR';
    else if (term === '3') fdType = '3_YEARS';

    // Create new FD with same amount
    await client.query(
      `INSERT INTO fixed_deposit (
        fd_id, account_id, fd_type, amount, interest_rate,
        start_date, maturity_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')`,
      [newFdId, oldFd.account_id, fdType, oldFd.amount, interestRate, startDate, maturityDate]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Fixed Deposit renewed successfully',
      old_fd_id: fdId,
      new_fd: {
        fd_id: newFdId,
        account_id: oldFd.account_id,
        fd_type: fdType,
        amount: oldFd.amount,
        interest_rate: interestRate,
        start_date: startDate,
        maturity_date: maturityDate,
        status: 'ACTIVE'
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error renewing FD:', err);
    res.status(400).json({ error: err.message || 'Failed to renew fixed deposit' });
  } finally {
    client.release();
  }
});

// Close Fixed Deposit (using database function)
router.post('/close/:fdId', authenticateToken, async (req, res) => {
  const { fdId } = req.params;
  const employeeId = req.user.employee_id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Use the close_fd database function
    const result = await client.query(
      'SELECT close_fd($1, $2) as result',
      [fdId, employeeId]
    );

    const closureResult = result.rows[0].result;

    await client.query('COMMIT');

    res.json(closureResult);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error closing FD:', err);
    
    // Handle specific error messages from the database function
    if (err.message.includes('Active FD not found')) {
      res.status(404).json({ error: 'Active Fixed Deposit not found' });
    } else {
      res.status(400).json({ error: err.message || 'Failed to close fixed deposit' });
    }
  } finally {
    client.release();
  }
});

// Get FD interest payment history
router.get('/:fdId/interest-history', authenticateToken, async (req, res) => {
  const { fdId } = req.params;

  try {
    // Get FD account
    const fdResult = await pool.query(
      'SELECT account_id FROM fixed_deposit WHERE fd_id = $1',
      [fdId]
    );

    if (fdResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fixed deposit not found' });
    }

    const accountId = fdResult.rows[0].account_id;

    // Get all FD interest transactions for THIS specific FD
    const result = await pool.query(
      `SELECT 
        transaction_id, amount, balance_before, time_date_stamp,
        description, reference_number
       FROM transaction
       WHERE account_id = $1 
       AND transaction_type = 'FD_INTEREST'
       AND description LIKE $2
       ORDER BY time_date_stamp DESC`,
      [accountId, `%${fdId}%`]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching FD interest history:', err);
    res.status(500).json({ error: 'Failed to fetch interest payment history' });
  }
});

// Function to automatically pay interest for all eligible active FDs
async function payAllFDInterests() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get all active FDs
    const fdResult = await client.query(
      `SELECT fd.*, a.current_balance
       FROM fixed_deposit fd
       JOIN account a ON fd.account_id = a.account_id
       WHERE fd.status = 'ACTIVE'`
    );

    const activeFDs = fdResult.rows;

    for (const fd of activeFDs) {
      // Calculate monthly interest
      const monthlyInterest = calculateMonthlyInterest(parseFloat(fd.amount), parseFloat(fd.interest_rate));

      // Check last interest payment to ensure 30 days have passed
      const lastPaymentResult = await client.query(
        `SELECT time_date_stamp
         FROM transaction
         WHERE account_id = $1 
         AND transaction_type = 'FD_INTEREST'
         AND description LIKE $2
         ORDER BY time_date_stamp DESC
         LIMIT 1`,
        [fd.account_id, `%${fd.fd_id}%`]
      );

      const lastPaymentDate = lastPaymentResult.rows.length > 0 
        ? new Date(lastPaymentResult.rows[0].time_date_stamp) 
        : new Date(fd.start_date);
      
      const daysSinceLastPayment = Math.floor((new Date() - lastPaymentDate) / (1000 * 60 * 60 * 24)); //
      
      if (daysSinceLastPayment >= 30 && monthlyInterest > 0) { // >= 1
        // Use record_deposit function with FD_INTEREST type and null employee_id
        const balanceBefore = parseFloat(fd.current_balance);
        
        await client.query(
          'SELECT * FROM record_deposit($1, $2, $3, $4, $5, $6)',
          [
            fd.account_id,
            monthlyInterest,
            `Automatic Monthly FD Interest - ${fd.fd_id}`,
            'FD_INTEREST',
            null, // employee_id set to null for automatic interest
            balanceBefore
          ]
        );

        console.log(`Automatic interest paid for FD ${fd.fd_id}: ${monthlyInterest.toFixed(2)}`);
      }
    }

    await client.query('COMMIT');
    console.log('Automatic FD interest payment job completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in automatic FD interest payment:', err);
  } finally {
    client.release();
  }
}

// Function to automatically mark FDs as matured
async function autoMatureFDs() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get all active FDs that have reached or passed their maturity date
    const today = new Date().toISOString().split('T')[0];
    const fdResult = await client.query(
      `UPDATE fixed_deposit
       SET status = 'MATURED'
       WHERE status = 'ACTIVE' AND maturity_date <= $1
       RETURNING fd_id, account_id`,
      [today]
    );

    const maturedFDs = fdResult.rows;

    await client.query('COMMIT');
    console.log(`Automatic FD maturity job completed successfully. Marked ${maturedFDs.length} FDs as MATURED.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in automatic FD maturity job:', err);
  } finally {
    client.release();
  }
}

// Schedule automatic interest payment to run daily at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running automatic FD interest payment job...');
  payAllFDInterests();
});

// Schedule automatic FD maturity check to run daily at 1 AM
cron.schedule('0 1 * * *', () => {
  console.log('Running automatic FD maturity job...');
  autoMatureFDs();
});

// For testing: Run every minute (comment out in production)
// cron.schedule('* * * * *', () => {
//   console.log('Running automatic FD interest payment job (test mode)...');
//   payAllFDInterests();
// });
// cron.schedule('* * * * *', () => {
//   console.log('Running automatic FD maturity job (test mode)...');
//   autoMatureFDs();
// });

module.exports = router;