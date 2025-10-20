// backend/routes/account.js
const express = require('express');
const pool = require('../db/index'); // your Pool
const authenticateToken = require('../middleware/auth'); // expects authenticateToken middleware
const router = express.Router();

/**
 * Helpers
 */

// Generate unique customer id: C000001
async function generateCustomerId(client) {
  const res = await client.query(
    `SELECT customer_id
     FROM customer
     WHERE customer_id ~ '^C[0-9]{6}$'
     ORDER BY CAST(SUBSTRING(customer_id FROM 2 FOR 6) AS INTEGER) DESC
     LIMIT 1`
  );

  if (res.rows.length === 0) return 'C000001';
  const last = res.rows[0].customer_id;
  const num = parseInt(last.substring(1), 10) + 1;
  return 'C' + num.toString().padStart(6, '0');
}

// Generate account id: uses account_type.type_code, branch, employee suffix, 5-digit seq
async function generateAccountId(client, accountTypeId, branchId, employeeId) {
  // get type_code from account_type table
  const typeRes = await client.query(
    'SELECT type_code FROM account_type WHERE account_type_id = $1',
    [accountTypeId]
  );
  if (typeRes.rows.length === 0) throw new Error('Invalid account type');

  const typeCode = typeRes.rows[0].type_code;
  // normalize branch and employee pieces
  const branchStr = branchId.toString().padStart(3, '0');
  const agentStr = (employeeId || '').toString().slice(-3).padStart(3, '0');

  // find current max sequence for this combination
  const seqRes = await client.query(
    `SELECT MAX(CAST(SUBSTRING(account_id FROM '-(\\d{5})$') AS INTEGER)) AS max_seq
     FROM account
     WHERE account_id LIKE $1`,
    [`${typeCode}-${branchStr}-${agentStr}-%`]
  );

  const maxSeq = seqRes.rows[0].max_seq || 0;
  const seq = (maxSeq || 0) + 1;
  const seqStr = seq.toString().padStart(5, '0');

  return `${typeCode}-${branchStr}-${agentStr}-${seqStr}`;
}

// Get branch_id for an employee
async function getBranchIdByEmployee(client, employeeId) {
  const res = await client.query(
    `SELECT branch_id FROM employee WHERE employee_id = $1`,
    [employeeId]
  );

  if (res.rows.length === 0) {
    throw new Error('Employee not found or not assigned to branch');
  }
  return res.rows[0].branch_id;
}

/**
 * Record initial deposit helper.
 * Uses your DB function record_deposit(account_id, amount, description, type, employee_id)
 * After calling it, fetches the most recent transaction for that account to return ids.
 */
async function recordInitialDeposit(client, accountId, amount, description, employeeId) {
  // Call DB function (explicit casts to reduce ambiguity)
  await client.query(
    `SELECT record_deposit($1::varchar, $2::numeric, $3::text, $4::text, $5::varchar)`,
    [accountId, amount, description, 'INITIAL', employeeId]
  );

  // Read the latest transaction for this account (relies on transaction_time column in your CSV)
  const txRes = await client.query(
    `SELECT transaction_id, reference_number
     FROM transaction
     WHERE account_id = $1
     ORDER BY transaction_time DESC
     LIMIT 1`,
    [accountId]
  );

  if (txRes.rows.length === 0) {
    // if not present, return nulls but don't fail (shouldn't happen)
    return { transactionId: null, referenceNumber: null };
  }

  return {
    transactionId: txRes.rows[0].transaction_id,
    referenceNumber: txRes.rows[0].reference_number || null
  };
}

/**
 * Routes
 */

// GET /api/accounts/account-types
// returns account types except fixed deposit (frontend expects this)
router.get('/account-types', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT account_type_id, account_type_name, interest_rate, 
              COALESCE(min_age, 0) AS min_age, COALESCE(max_age, 0) AS max_age,
              COALESCE(minimum_balance, '0') AS minimum_balance, type_code
       FROM account_type
       WHERE LOWER(account_type_name) NOT LIKE '%fixed%'
       ORDER BY account_type_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching account types:', err);
    res.status(500).json({ error: 'Failed to fetch account types' });
  }
});

// GET /api/accounts/customer/check/:nic
router.get('/customer/check/:nic', authenticateToken, async (req, res) => {
  const nic = req.params.nic;
  try {
    const result = await pool.query(
      `SELECT customer_id, first_name, last_name, nic_number, date_of_birth, gender, phone_number, email, address, status
       FROM customer
       WHERE nic_number = $1`,
      [nic]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error checking customer:', err);
    res.status(500).json({ error: 'Failed to check customer' });
  }
});

/**
 * POST /api/accounts/account/register-and-open
 * - Registers a new customer (if NIC doesn't exist) and opens an account for that single customer.
 * - Body expected:
 *   {
 *     firstName, lastName, nicNumber, dateOfBirth, gender,
 *     phoneNumber, email, address, accountTypeId, initialDeposit
 *   }
 *
 * This endpoint implements the full Savings (single-customer) flow.
 */
router.post('/account/register-and-open', authenticateToken, async (req, res) => {
  const {
    firstName, lastName, nicNumber, dateOfBirth, gender,
    phoneNumber, email, address, accountTypeId, initialDeposit
  } = req.body;

  // logged-in employee
  const employeeId = req.user && req.user.employee_id;
  if (!employeeId) return res.status(401).json({ error: 'Unauthorized' });

  // basic validation
  if (!firstName || !lastName || !nicNumber || !dateOfBirth ||
      !gender || !phoneNumber || !email || !address ||
      !accountTypeId || initialDeposit === undefined || initialDeposit === null) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Branch for employee
    const branchId = await getBranchIdByEmployee(client, employeeId);

    // 2) Ensure account type exists and get minimum balance
    const atRes = await client.query(
      'SELECT minimum_balance FROM account_type WHERE account_type_id = $1',
      [accountTypeId]
    );
    if (atRes.rows.length === 0) throw new Error('Invalid account type');

    const minBalance = parseFloat(atRes.rows[0].minimum_balance || '0');
    const deposit = parseFloat(initialDeposit);
    if (Number.isNaN(deposit)) throw new Error('Invalid initial deposit amount');
    if (deposit < minBalance) throw new Error(`Initial deposit must be at least ${minBalance}`);

    // 3) Check if customer exists by NIC
    let customerId;
    const existing = await client.query('SELECT customer_id, status FROM customer WHERE nic_number = $1', [nicNumber]);
    if (existing.rows.length > 0) {
      customerId = existing.rows[0].customer_id;
      if (existing.rows[0].status !== 'ACTIVE') {
        throw new Error('Existing customer is not active');
      }
    } else {
      // create new customer
      customerId = await generateCustomerId(client);
      await client.query(
        `INSERT INTO customer (
          customer_id, agent_id, first_name, last_name, nic_number,
          date_of_birth, gender, phone_number, email, address,
          registration_date, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CURRENT_DATE,'ACTIVE')`,
        [customerId, employeeId, firstName, lastName, nicNumber, dateOfBirth, gender.toUpperCase(), phoneNumber, email, address]
      );
    }

    // 4) Create account id
    const accountId = await generateAccountId(client, accountTypeId, branchId, employeeId);

    // 5) Insert account record (start with 0 balance; we'll record deposit next)
    await client.query(
      `INSERT INTO account (account_id, branch_id, account_type_id, current_balance, status)
       VALUES ($1,$2,$3,0,'ACTIVE')`,
      [accountId, branchId, accountTypeId]
    );

    // 6) Link account holder
    await client.query(
      `INSERT INTO account_holder (customer_id, account_id, created_at) VALUES ($1,$2,CURRENT_TIMESTAMP)`,
      [customerId, accountId]
    );

    // 7) Record initial deposit using DB function and fetch transaction ids
    const { transactionId, referenceNumber } = await recordInitialDeposit(client, accountId, deposit, 'Initial deposit for new account', employeeId);

    // 8) commit
    await client.query('COMMIT');

    // return created objects
    res.status(201).json({
      message: 'Customer registered and account opened successfully',
      customer: {
        customer_id: customerId,
        first_name: firstName,
        last_name: lastName,
        nic_number: nicNumber
      },
      account: {
        account_id: accountId,
        account_type_id: accountTypeId,
        initial_balance: deposit,
        status: 'ACTIVE'
      },
      transaction: {
        transaction_id: transactionId,
        reference_number: referenceNumber
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in register-and-open:', err);
    res.status(400).json({ error: err.message || 'Failed to register customer and open account' });
  } finally {
    client.release();
  }
});

module.exports = router;
