// backend/routes/transactions.js
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
  const prefix = 'TXN-';

  const result = await client.query(
    `SELECT transaction_id FROM transaction 
     WHERE transaction_id LIKE $1
     ORDER BY transaction_id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let sequence = 1;
  if (result.rows.length > 0) {
    const lastId = result.rows[0].transaction_id;
    const lastSeq = parseInt(lastId.slice(prefix.length));
    sequence = lastSeq + 1;
  }

  return `${prefix}${sequence.toString().padStart(5, '0')}`;
}

// Generate reference number: REF-[8 random alphanumeric]
async function generateReferenceNumber(client = pool) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let ref;
  let exists;
  do {
    ref = 'REF-';
    for (let i = 0; i < 8; i++) {
      ref += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const result = await client.query(
      'SELECT reference_number FROM transaction WHERE reference_number = $1',
      [ref]
    );
    exists = result.rows.length > 0;
  } while (exists);

  return ref;
}

// Record initial deposit transaction
async function recordInitialDeposit(client = pool, accountId, amount, description = 'Initial deposit') {
  let ownClient = false;
  if (client === pool) {
    client = await pool.connect();
    ownClient = true;
    await client.query('BEGIN');
  }
  try {
    const transactionId = await generateTransactionId(client);
    const referenceNumber = await generateReferenceNumber(client);

    await client.query(
      `INSERT INTO transaction (
        transaction_id, account_id, transaction_type, amount,
        balance_before, time_date_stamp, description, status, reference_number
      ) VALUES ($1, $2, 'INITIAL', $3, 0, CURRENT_TIMESTAMP, $4, 'SUCCESS', $5)
      RETURNING transaction_id, reference_number`,
      [transactionId, accountId, amount, description, referenceNumber]
    );

    // Update account balance (assuming initial balance is 0)
    await client.query(
      'UPDATE account SET current_balance = current_balance + $1 WHERE account_id = $2',
      [amount, accountId]
    );

    if (ownClient) {
      await client.query('COMMIT');
    }

    return { transactionId, referenceNumber };
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
async function recordDeposit(client = pool, accountId, amount, description = 'Deposit') {
  let ownClient = false;
  if (client === pool) {
    client = await pool.connect();
    ownClient = true;
    await client.query('BEGIN');
  }
  try {
    // Get current balance
    const balanceResult = await client.query(
      'SELECT current_balance FROM account WHERE account_id = $1',
      [accountId]
    );

    if (balanceResult.rows.length === 0) {
      throw new Error('Account not found');
    }

    const balanceBefore = parseFloat(balanceResult.rows[0].current_balance);
    const transactionId = await generateTransactionId(client);
    const referenceNumber = await generateReferenceNumber(client);

    // Record transaction and return the timestamp
    const transactionResult = await client.query(
      `INSERT INTO transaction (
        transaction_id, account_id, transaction_type, amount,
        balance_before, time_date_stamp, description, status, reference_number
      ) VALUES ($1, $2, 'DEPOSIT', $3, $4, CURRENT_TIMESTAMP, $5, 'SUCCESS', $6)
      RETURNING transaction_id, reference_number, time_date_stamp`,
      [transactionId, accountId, amount, balanceBefore, description, referenceNumber]
    );

    // Update account balance
    await client.query(
      'UPDATE account SET current_balance = current_balance + $1 WHERE account_id = $2',
      [amount, accountId]
    );

    if (ownClient) {
      await client.query('COMMIT');
    }

    const insertedTransaction = transactionResult.rows[0];

    return { 
      transactionId: insertedTransaction.transaction_id, 
      referenceNumber: insertedTransaction.reference_number,
      time_date_stamp: insertedTransaction.time_date_stamp,
      balanceBefore, 
      balanceAfter: balanceBefore + amount 
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
async function recordWithdrawal(client = pool, accountId, amount, description = 'Withdrawal') {
  let ownClient = false;
  if (client === pool) {
    client = await pool.connect();
    ownClient = true;
    await client.query('BEGIN');
  }
  try {
    // Get current balance
    const balanceResult = await client.query(
      'SELECT current_balance FROM account WHERE account_id = $1',
      [accountId]
    );

    if (balanceResult.rows.length === 0) {
      throw new Error('Account not found');
    }

    const balanceBefore = parseFloat(balanceResult.rows[0].current_balance);

    if (balanceBefore < amount) {
      throw new Error('Insufficient balance');
    }

    const transactionId = await generateTransactionId(client);
    const referenceNumber = await generateReferenceNumber(client);

    // Record transaction and return the timestamp
    const transactionResult = await client.query(
      `INSERT INTO transaction (
        transaction_id, account_id, transaction_type, amount,
        balance_before, time_date_stamp, description, status, reference_number
      ) VALUES ($1, $2, 'WITHDRAWAL', $3, $4, CURRENT_TIMESTAMP, $5, 'SUCCESS', $6)
      RETURNING transaction_id, reference_number, time_date_stamp`,
      [transactionId, accountId, amount, balanceBefore, description, referenceNumber]
    );

    // Update account balance
    await client.query(
      'UPDATE account SET current_balance = current_balance - $1 WHERE account_id = $2',
      [amount, accountId]
    );

    if (ownClient) {
      await client.query('COMMIT');
    }

    const insertedTransaction = transactionResult.rows[0];

    return { 
      transactionId: insertedTransaction.transaction_id, 
      referenceNumber: insertedTransaction.reference_number,
      time_date_stamp: insertedTransaction.time_date_stamp,
      balanceBefore, 
      balanceAfter: balanceBefore - amount 
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

// Record FD Interest transaction
async function recordFDInterest(client = pool, accountId, amount, description = 'FD Interest', balanceBefore) {
  let ownClient = false;
  if (client === pool) {
    client = await pool.connect();
    ownClient = true;
    await client.query('BEGIN');
  }
  try {
    const transactionId = await generateTransactionId(client);
    const referenceNumber = await generateReferenceNumber(client);

    await client.query(
      `INSERT INTO transaction (
        transaction_id, account_id, transaction_type, amount,
        balance_before, time_date_stamp, description, status, reference_number
      ) VALUES ($1, $2, 'FD_INTEREST', $3, $4, CURRENT_TIMESTAMP, $5, 'SUCCESS', $6)`,
      [transactionId, accountId, amount, balanceBefore, description, referenceNumber]
    );

    // Update account balance
    await client.query(
      'UPDATE account SET current_balance = current_balance + $1 WHERE account_id = $2',
      [amount, accountId]
    );

    if (ownClient) {
      await client.query('COMMIT');
    }

    return { transactionId, referenceNumber };
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
        balance_before, time_date_stamp, description, status, reference_number
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
        t.balance_before, t.time_date_stamp, t.description, t.status, t.reference_number,
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

  if (!accountId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await recordDeposit(client, accountId, parseFloat(amount), description);

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

  if (!accountId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await recordWithdrawal(client, accountId, parseFloat(amount), description);

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

module.exports = {
  router,
  recordInitialDeposit,
  recordDeposit,
  recordWithdrawal,
  recordFDInterest,
  generateTransactionId,
  generateReferenceNumber
};