const express = require('express');
const pool = require('../db/index');
const authenticateToken = require('../middleware/auth');
const cors = require('cors');

const router = express.Router();

router.use(cors({
  origin: true,
  credentials: true
}));

// Generate unique transaction ID: TXN-[00001]
async function generateTransactionId(client = pool) {
  const result = await client.query('SELECT generate_transaction_id() AS id');
  return result.rows[0].id;
}

// Generate reference number: REF-[8 random alphanumeric]
async function generateReferenceNumber(client = pool) {
  const result = await client.query('SELECT generate_reference_number() AS ref');
  return result.rows[0].ref;
}

// Record initial deposit transaction
async function recordInitialDeposit(client = pool, accountId, amount, description = 'Initial deposit', employeeId) {
  let ownClient = false;
  if (client === pool) {
    client = await pool.connect();
    ownClient = true;
    await client.query('BEGIN');
  }
  try {
    const result = await client.query(
      'SELECT * FROM record_deposit($1, $2, $3, $4, $5)',
      [accountId, amount, description, 'INITIAL', employeeId]
    );
    const inserted = result.rows[0];

    if (ownClient) {
      await client.query('COMMIT');
    }

    return { transactionId: inserted.transaction_id, referenceNumber: inserted.reference_number };
  } catch (err) {
    if (ownClient) {
      await client.query('ROLLBACK');
    }
    console.error('Error recording initial deposit:', err);
    throw new Error('Failed to record initial deposit transaction');
  } finally {
    if (ownClient) {
      client.release();
    }
  }
}

// Record deposit transaction
async function recordDeposit(client = pool, accountId, amount, description = 'Deposit', transactionType = 'DEPOSIT', employeeId) {
  let ownClient = false;
  if (client === pool) {
    client = await pool.connect();
    ownClient = true;
    await client.query('BEGIN');
  }
  try {
    const result = await client.query(
      'SELECT * FROM record_deposit($1, $2, $3, $4, $5)',
      [accountId, amount, description, transactionType, employeeId]
    );
    const inserted = result.rows[0];

    if (ownClient) {
      await client.query('COMMIT');
    }

    return { 
      transactionId: inserted.transaction_id, 
      referenceNumber: inserted.reference_number,
      time_date_stamp: inserted.time_date_stamp,
      balanceBefore: inserted.balance_before, 
      balanceAfter: inserted.balance_after 
    };
  } catch (err) {
    if (ownClient) {
      await client.query('ROLLBACK');
    }
    console.error('Error recording deposit:', err);
    throw new Error('Failed to record deposit transaction');
  } finally {
    if (ownClient) {
      client.release();
    }
  }
}

// Record withdrawal transaction
async function recordWithdrawal(client = pool, accountId, amount, description = 'Withdrawal', transactionType = 'WITHDRAWAL', employeeId) {
  let ownClient = false;
  if (client === pool) {
    client = await pool.connect();
    ownClient = true;
    await client.query('BEGIN');
  }
  try {
    const result = await client.query(
      'SELECT * FROM record_withdrawal($1, $2, $3, $4, $5)',
      [accountId, amount, description, transactionType, employeeId]
    );
    const inserted = result.rows[0];

    if (ownClient) {
      await client.query('COMMIT');
    }

    return { 
      transactionId: inserted.transaction_id, 
      referenceNumber: inserted.reference_number,
      time_date_stamp: inserted.time_date_stamp,
      balanceBefore: inserted.balance_before, 
      balanceAfter: inserted.balance_after 
    };
  } catch (err) {
    if (ownClient) {
      await client.query('ROLLBACK');
    }
    console.error('Error recording withdrawal:', err);
    throw new Error('Failed to record withdrawal transaction');
  } finally {
    if (ownClient) {
      client.release();
    }
  }
}

// Record transfer (withdrawal from one, deposit to another)
async function recordTransfer(client = pool, fromAccountId, toAccountId, amount, description = 'Transfer', employeeId) {
  let ownClient = false;
  if (client === pool) {
    client = await pool.connect();
    ownClient = true;
    await client.query('BEGIN');
  }
  try {
    const result = await client.query(
      'SELECT * FROM record_transfer($1, $2, $3, $4, $5)',
      [fromAccountId, toAccountId, amount, description, employeeId]
    );
    const inserted = result.rows[0];

    if (ownClient) {
      await client.query('COMMIT');
    }

    return {
      transactionId: inserted.transaction_id, 
      referenceNumber: inserted.reference_number,
      time_date_stamp: inserted.time_date_stamp,
      fromBalanceBefore: inserted.from_balance_before,
      fromBalanceAfter: inserted.from_balance_after,
      toBalanceBefore: inserted.to_balance_before,
      toBalanceAfter: inserted.to_balance_after
    };
  } catch (err) {
    if (ownClient) {
      await client.query('ROLLBACK');
    }
    console.error('Error recording transfer:', err);
    throw new Error('Failed to record transfer transaction');
  } finally {
    if (ownClient) {
      client.release();
    }
  }
}

// Record FD Interest transaction
async function recordFDInterest(client = pool, accountId, amount, description = 'FD Interest', balanceBefore, employeeId) {
  let ownClient = false;
  if (client === pool) {
    client = await pool.connect();
    ownClient = true;
    await client.query('BEGIN');
  }
  try {
    const result = await client.query(
      'SELECT * FROM record_deposit($1, $2, $3, $4, $5, $6)',
      [accountId, amount, description, 'FD_INTEREST', employeeId, balanceBefore]
    );
    const inserted = result.rows[0];

    if (ownClient) {
      await client.query('COMMIT');
    }

    return { transactionId: inserted.transaction_id, referenceNumber: inserted.reference_number };
  } catch (err) {
    if (ownClient) {
      await client.query('ROLLBACK');
    }
    console.error('Error recording FD interest:', err);
    throw new Error('Failed to record FD interest transaction');
  } finally {
    if (ownClient) {
      client.release();
    }
  }
}

// Get transaction history for an account
router.get('/account/:accountId/history', authenticateToken, async (req, res) => {
  const { accountId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  try {
    const result = await pool.query(
      `SELECT 
        transaction_id, account_id, transaction_type, amount,
        balance_before, time_date_stamp, description, status, reference_number, employee_id
       FROM transaction
       WHERE account_id = $1
       ORDER BY time_date_stamp DESC
       LIMIT $2 OFFSET $3`,
      [accountId, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching transaction history:', err);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

// Get single transaction details
router.get('/transaction/:transactionId', authenticateToken, async (req, res) => {
  const { transactionId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        t.transaction_id, t.account_id, t.transaction_type, t.amount,
        t.balance_before, t.time_date_stamp, t.description, t.status, t.reference_number, t.employee_id,
        a.account_type_id, at.account_type_name
       FROM transaction t
       JOIN account a ON t.account_id = a.account_id
       JOIN account_type at ON a.account_type_id = at.account_type_id
       WHERE t.transaction_id = $1`,
      [transactionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching transaction:', err);
    res.status(500).json({ error: 'Failed to fetch transaction details' });
  }
});

// Get account info for validation
router.get('/account/:accountId/info', authenticateToken, async (req, res) => {
  const { accountId } = req.params;

  try {
    const accountResult = await pool.query(
      `SELECT a.current_balance, at.account_type_name
       FROM account a
       JOIN account_type at ON a.account_type_id = at.account_type_id
       WHERE a.account_id = $1`,
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = accountResult.rows[0];

    // Get all holders
    const holdersResult = await pool.query(
      `SELECT c.first_name, c.last_name, c.nic_number, c.phone_number, c.email
       FROM account_holder ah
       JOIN customer c ON ah.customer_id = c.customer_id
       WHERE ah.account_id = $1`,
      [accountId]
    );

    const holders = holdersResult.rows.map(row => ({
      customerName: `${row.first_name} ${row.last_name}`,
      nic: row.nic_number,
      phone: row.phone_number,
      email: row.email
    }));

    res.json({
      holders,
      accountType: account.account_type_name,
      currentBalance: account.current_balance.toString(),
      availableBalance: account.current_balance.toString()
    });
  } catch (err) {
    console.error('Error fetching account info:', err);
    res.status(500).json({ error: 'Failed to fetch account info' });
  }
});

// Process new deposit
router.post('/deposit', authenticateToken, async (req, res) => {
  const { accountId, amount, description = 'Deposit' } = req.body;
  const employeeId = req.user.employee_id;

  if (!accountId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await recordDeposit(client, accountId, parseFloat(amount), description, 'DEPOSIT', employeeId);

    // Fetch account info
    const accountResult = await client.query(
      `SELECT a.account_id, at.account_type_name
       FROM account a
       JOIN account_type at ON a.account_type_id = at.account_type_id
       WHERE a.account_id = $1`,
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      throw new Error('Account not found');
    }

    const account = accountResult.rows[0];

    // Fetch holders
    const holdersResult = await client.query(
      `SELECT c.first_name, c.last_name, c.nic_number, c.phone_number, c.email
       FROM account_holder ah
       JOIN customer c ON ah.customer_id = c.customer_id
       WHERE ah.account_id = $1`,
      [accountId]
    );

    const holders = holdersResult.rows;

    await client.query('COMMIT');

    res.json({
      transaction: result,
      accountInfo: { account, holders },
      depositAmount: amount,
      remarks: description
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error processing deposit:', err);
    res.status(500).json({ error: 'Failed to process deposit' });
  } finally {
    client.release();
  }
});

// Process new withdrawal
router.post('/withdrawal', authenticateToken, async (req, res) => {
  const { accountId, amount, description = 'Withdrawal' } = req.body;
  const employeeId = req.user.employee_id;

  if (!accountId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await recordWithdrawal(client, accountId, parseFloat(amount), description, 'WITHDRAWAL', employeeId);

    // Fetch account info
    const accountResult = await client.query(
      `SELECT a.account_id, at.account_type_name
       FROM account a
       JOIN account_type at ON a.account_type_id = at.account_type_id
       WHERE a.account_id = $1`,
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      throw new Error('Account not found');
    }

    const account = accountResult.rows[0];

    // Fetch holders
    const holdersResult = await client.query(
      `SELECT c.first_name, c.last_name, c.nic_number, c.phone_number, c.email
       FROM account_holder ah
       JOIN customer c ON ah.customer_id = c.customer_id
       WHERE ah.account_id = $1`,
      [accountId]
    );

    const holders = holdersResult.rows;

    await client.query('COMMIT');

    res.json({
      transaction: result,
      accountInfo: { account, holders },
      withdrawalAmount: amount,
      remarks: description
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error processing withdrawal:', err);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  } finally {
    client.release();
  }
});

// Process new transfer
router.post('/transfer', authenticateToken, async (req, res) => {
  const { fromAccountId, toAccountId, amount, description = 'Transfer' } = req.body;
  const employeeId = req.user.employee_id;

  if (!fromAccountId || !toAccountId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (fromAccountId === toAccountId) {
    return res.status(400).json({ error: 'Cannot transfer to the same account' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await recordTransfer(client, fromAccountId, toAccountId, parseFloat(amount), description, employeeId);

    // Fetch from account info
    const fromAccountResult = await client.query(
      `SELECT a.account_id, at.account_type_name
       FROM account a
       JOIN account_type at ON a.account_type_id = at.account_type_id
       WHERE a.account_id = $1`,
      [fromAccountId]
    );

    if (fromAccountResult.rows.length === 0) {
      throw new Error('From account not found');
    }

    const fromAccount = fromAccountResult.rows[0];

    const fromHoldersResult = await client.query(
      `SELECT c.first_name, c.last_name, c.nic_number, c.phone_number, c.email
       FROM account_holder ah
       JOIN customer c ON ah.customer_id = c.customer_id
       WHERE ah.account_id = $1`,
      [fromAccountId]
    );

    const fromHolders = fromHoldersResult.rows;

    // Fetch to account info
    const toAccountResult = await client.query(
      `SELECT a.account_id, at.account_type_name
       FROM account a
       JOIN account_type at ON a.account_type_id = at.account_type_id
       WHERE a.account_id = $1`,
      [toAccountId]
    );

    if (toAccountResult.rows.length === 0) {
      throw new Error('To account not found');
    }

    const toAccount = toAccountResult.rows[0];

    const toHoldersResult = await client.query(
      `SELECT c.first_name, c.last_name, c.nic_number, c.phone_number, c.email
       FROM account_holder ah
       JOIN customer c ON ah.customer_id = c.customer_id
       WHERE ah.account_id = $1`,
      [toAccountId]
    );

    const toHolders = toHoldersResult.rows;

    await client.query('COMMIT');

    res.json({
      transaction: result,
      fromAccountInfo: { account: fromAccount, holders: fromHolders },
      toAccountInfo: { account: toAccount, holders: toHolders },
      transferAmount: amount,
      remarks: description
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error processing transfer:', err);
    res.status(500).json({ error: 'Failed to process transfer' });
  } finally {
    client.release();
  }
});

// Get all transactions with customer and employee info
router.get('/all', authenticateToken, async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;

  try {
    const result = await pool.query(
      `SELECT 
        t.transaction_id, 
        t.account_id, 
        t.transaction_type, 
        t.amount,
        t.balance_before, 
        t.time_date_stamp, 
        t.description, 
        t.status, 
        t.reference_number,
        t.employee_id,
        COALESCE(
          STRING_AGG(DISTINCT c.first_name || ' ' || c.last_name, ', '),
          'N/A'
        ) as customer_name,
        MIN(e.employee_id) as employee_id,
        COALESCE(MIN(e.first_name || ' ' || e.last_name), 'System') as employee_name,
        MIN(b.branch_name) as branch_name
       FROM transaction t
       LEFT JOIN account_holder ah ON t.account_id = ah.account_id
       LEFT JOIN customer c ON ah.customer_id = c.customer_id
       LEFT JOIN employee e ON t.employee_id = e.employee_id
       LEFT JOIN account a ON t.account_id = a.account_id
       LEFT JOIN branch b ON a.branch_id = b.branch_id
       GROUP BY t.transaction_id, t.account_id, t.transaction_type, t.amount,
                t.balance_before, t.time_date_stamp, t.description, t.status, 
                t.reference_number, t.employee_id
       ORDER BY t.time_date_stamp DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get full transaction details for printing
router.get('/:transactionId/full', authenticateToken, async (req, res) => {
  const { transactionId } = req.params;

  try {
    // Get transaction details
    const txnResult = await pool.query(
      `SELECT * FROM transaction WHERE transaction_id = $1`,
      [transactionId]
    );

    if (txnResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const txn = txnResult.rows[0];

    // Get account info
    const accountResult = await pool.query(
      `SELECT a.account_id, at.account_type_name
       FROM account a
       JOIN account_type at ON a.account_type_id = at.account_type_id
       WHERE a.account_id = $1`,
      [txn.account_id]
    );

    // Get holders
    const holdersResult = await pool.query(
      `SELECT c.first_name, c.last_name, c.nic_number, c.phone_number, c.email
       FROM account_holder ah
       JOIN customer c ON ah.customer_id = c.customer_id
       WHERE ah.account_id = $1`,
      [txn.account_id]
    );

    let responseData = {
      transaction: txn,
      accountInfo: {
        account: accountResult.rows[0],
        holders: holdersResult.rows
      }
    };

    // For transfers, get the other account info
    if (txn.transaction_type === 'TRANSFER_IN' || txn.transaction_type === 'TRANSFER_OUT') {
      // Find the paired transaction (same reference number, different account)
      const pairedTxnResult = await pool.query(
        `SELECT account_id FROM transaction 
         WHERE reference_number = $1 AND account_id != $2`,
        [txn.reference_number, txn.account_id]
      );

      if (pairedTxnResult.rows.length > 0) {
        const otherAccountId = pairedTxnResult.rows[0].account_id;

        const otherAccountResult = await pool.query(
          `SELECT a.account_id, at.account_type_name
           FROM account a
           JOIN account_type at ON a.account_type_id = at.account_type_id
           WHERE a.account_id = $1`,
          [otherAccountId]
        );

        const otherHoldersResult = await pool.query(
          `SELECT c.first_name, c.last_name, c.nic_number, c.phone_number, c.email
           FROM account_holder ah
           JOIN customer c ON ah.customer_id = c.customer_id
           WHERE ah.account_id = $1`,
          [otherAccountId]
        );

        if (txn.transaction_type === 'TRANSFER_OUT') {
          responseData = {
            ...responseData,
            fromAccountInfo: responseData.accountInfo,
            toAccountInfo: {
              account: otherAccountResult.rows[0],
              holders: otherHoldersResult.rows
            }
          };
        } else {
          responseData = {
            ...responseData,
            fromAccountInfo: {
              account: otherAccountResult.rows[0],
              holders: otherHoldersResult.rows
            },
            toAccountInfo: responseData.accountInfo
          };
        }
      }
    }

    res.json(responseData);
  } catch (err) {
    console.error('Error fetching full transaction details:', err);
    res.status(500).json({ error: 'Failed to fetch transaction details' });
  }
});

// GET /daily-trends (with optional branchId query param)
router.get('/daily-trends', authenticateToken, async (req, res) => {
  const { branchId } = req.query;

  try {
    const query = `
      WITH days AS (
        SELECT generate_series(
          DATE_TRUNC('month', CURRENT_DATE),
          CURRENT_DATE,
          '1 day'
        )::date AS day
      ),
      trends AS (
        SELECT 
          DATE(t.time_date_stamp) AS day,
          SUM(CASE WHEN transaction_type IN ('DEPOSIT', 'INITIAL', 'TRANSFER_IN', 'FD_INTEREST', 'SAVINGS_INTEREST') THEN amount ELSE 0 END) as deposits,
          SUM(CASE WHEN transaction_type IN ('WITHDRAWAL', 'TRANSFER_OUT') THEN amount ELSE 0 END) as withdrawals
        FROM transaction t
        JOIN account a ON t.account_id = a.account_id
        ${branchId ? 'WHERE a.branch_id = $1' : ''}
        GROUP BY DATE(t.time_date_stamp)
      )
      SELECT 
        TO_CHAR(d.day, 'DD Mon') as label,
        COALESCE(tr.deposits, 0) as deposits,
        COALESCE(tr.withdrawals, 0) as withdrawals
      FROM days d
      LEFT JOIN trends tr ON d.day = tr.day
      ORDER BY d.day ASC
    `;
    const params = branchId ? [branchId] : [];
    const result = await pool.query(query, params);
    const labels = result.rows.map(r => r.label);
    const deposits = result.rows.map(r => parseFloat(r.deposits));
    const withdrawals = result.rows.map(r => parseFloat(r.withdrawals));
    res.json({ labels, deposits, withdrawals });
  } catch (err) {
    console.error('Error fetching daily trends:', err);
    res.status(500).json({ error: 'Failed to fetch daily trends' });
  }
});

// Existing routes (for reference, ensure these are included if not already present)
// GET /daily-summary (with optional branchId query param)
router.get('/daily-summary', authenticateToken, async (req, res) => {
  const { branchId } = req.query;

  try {
    let query = `
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type IN ('DEPOSIT', 'INITIAL', 'TRANSFER_IN', 'FD_INTEREST', 'SAVINGS_INTEREST') THEN amount ELSE 0 END), 0) as deposits,
        COALESCE(SUM(CASE WHEN transaction_type IN ('WITHDRAWAL', 'TRANSFER_OUT') THEN amount ELSE 0 END), 0) as withdrawals
      FROM transaction t
      JOIN account a ON t.account_id = a.account_id
      WHERE DATE(t.time_date_stamp) = CURRENT_DATE
    `;
    const params = [];
    if (branchId) {
      query += ` AND a.branch_id = $1`;
      params.push(branchId);
    }
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching daily summary:', err);
    res.status(500).json({ error: 'Failed to fetch daily summary' });
  }
});

// GET /monthly-trends (with optional branchId query param)
router.get('/monthly-trends', authenticateToken, async (req, res) => {
  const { branchId } = req.query;

  try {
    const query = `
      WITH months AS (
        SELECT generate_series(
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months'),
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'
        )::date AS month
      ),
      trends AS (
        SELECT 
          DATE_TRUNC('month', t.time_date_stamp)::date AS month,
          SUM(CASE WHEN transaction_type IN ('DEPOSIT', 'INITIAL', 'TRANSFER_IN', 'FD_INTEREST', 'SAVINGS_INTEREST') THEN amount ELSE 0 END) as deposits,
          SUM(CASE WHEN transaction_type IN ('WITHDRAWAL', 'TRANSFER_OUT') THEN amount ELSE 0 END) as withdrawals
        FROM transaction t
        JOIN account a ON t.account_id = a.account_id
        ${branchId ? 'WHERE a.branch_id = $1' : ''}
        GROUP BY DATE_TRUNC('month', t.time_date_stamp)
      )
      SELECT 
        TO_CHAR(m.month, 'Mon') as label,
        COALESCE(tr.deposits, 0) as deposits,
        COALESCE(tr.withdrawals, 0) as withdrawals
      FROM months m
      LEFT JOIN trends tr ON m.month = tr.month
      ORDER BY m.month ASC
    `;
    const params = branchId ? [branchId] : [];
    const result = await pool.query(query, params);
    const labels = result.rows.map(r => r.label);
    const deposits = result.rows.map(r => parseFloat(r.deposits));
    const withdrawals = result.rows.map(r => parseFloat(r.withdrawals));
    res.json({ labels, deposits, withdrawals });
  } catch (err) {
    console.error('Error fetching monthly trends:', err);
    res.status(500).json({ error: 'Failed to fetch monthly trends' });
  }
});

// Export the router with updated endpoints
module.exports = {
  router,
  recordInitialDeposit,
  recordDeposit,
  recordWithdrawal,
  recordFDInterest,
  recordTransfer,
  generateTransactionId,
  generateReferenceNumber
};