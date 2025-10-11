// backend/routes/transactions.js
const express = require('express');
const pool = require('../db/index');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Generate unique transaction ID: TXN[YYMMDD][00001]
async function generateTransactionId(client = pool) {
  const prefix = `TXN`;

  const result = await client.query(
    `SELECT transaction_id FROM transaction 
     WHERE transaction_id LIKE $1
     ORDER BY transaction_id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let sequence = 1;
  if (result.rows.length > 0) {
    const lastId = result.rows[0].transaction_id;
    const lastSeq = parseInt(lastId.split('-').pop());
    sequence = lastSeq + 1;
  }

  return `${prefix}-${sequence.toString().padStart(5, '0')}`;
}

// Generate reference number: REF-[8 random alphanumeric]
function generateReferenceNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'REF-';
  for (let i = 0; i < 8; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

// Record initial deposit transaction
async function recordInitialDeposit(client, accountId, amount, description = 'Initial deposit') {
  try {
    const transactionId = await generateTransactionId(client);
    const referenceNumber = generateReferenceNumber();

    await client.query(
      `INSERT INTO transaction (
        transaction_id, account_id, transaction_type, amount,
        balance_before, time_date_stamp, description, status, reference_number
      ) VALUES ($1, $2, 'INITIAL', $3, 0, CURRENT_TIMESTAMP, $4, 'SUCCESS', $5)
      RETURNING transaction_id, reference_number`,
      [transactionId, accountId, amount, description, referenceNumber]
    );

    return { transactionId, referenceNumber };
  } catch (err) {
    console.error('Error recording initial deposit:', err);
    throw new Error('Failed to record initial deposit transaction');
  }
}

// Record deposit transaction
async function recordDeposit(client, accountId, amount, description = 'Deposit') {
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
    const referenceNumber = generateReferenceNumber();

    // Record transaction
    await client.query(
      `INSERT INTO transaction (
        transaction_id, account_id, transaction_type, amount,
        balance_before, time_date_stamp, description, status, reference_number
      ) VALUES ($1, $2, 'DEPOSIT', $3, $4, CURRENT_TIMESTAMP, $5, 'SUCCESS', $6)`,
      [transactionId, accountId, amount, balanceBefore, description, referenceNumber]
    );

    // Update account balance
    await client.query(
      'UPDATE account SET current_balance = current_balance + $1 WHERE account_id = $2',
      [amount, accountId]
    );

    return { transactionId, referenceNumber, balanceBefore, balanceAfter: balanceBefore + amount };
  } catch (err) {
    console.error('Error recording deposit:', err);
    throw new Error('Failed to record deposit transaction');
  }
}

// Record FD Interest transaction
async function recordFDInterest(client, accountId, amount, description = 'FD Interest', balanceBefore) {
  try {
    const transactionId = await generateTransactionId(client);
    const referenceNumber = generateReferenceNumber();

    await client.query(
      `INSERT INTO transaction (
        transaction_id, account_id, transaction_type, amount,
        balance_before, time_date_stamp, description, status, reference_number
      ) VALUES ($1, $2, 'FD_INTEREST', $3, $4, CURRENT_TIMESTAMP, $5, 'SUCCESS', $6)`,
      [transactionId, accountId, amount, balanceBefore, description, referenceNumber]
    );

    return { transactionId, referenceNumber };
  } catch (err) {
    console.error('Error recording FD interest:', err);
    throw new Error('Failed to record FD interest transaction');
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

module.exports = {
  router,
  recordInitialDeposit,
  recordDeposit,
  recordFDInterest,
  generateTransactionId,
  generateReferenceNumber
};