const express = require('express');
const pool = require('../db/index');
const authenticateToken = require('../middleware/auth');
const { recordInitialDeposit } = require('./transactions');

const router = express.Router();

// Generate unique customer ID: C000001 format
async function generateCustomerId(client = pool) {
  const result = await client.query(
    `SELECT customer_id FROM customer 
     WHERE customer_id ~ '^C[0-9]{6}$'
     ORDER BY CAST(SUBSTRING(customer_id FROM 2 FOR 6) AS INTEGER) DESC LIMIT 1`
  );

  if (result.rows.length === 0) return 'C000001';

  const lastId = result.rows[0].customer_id;
  const numPart = parseInt(lastId.substring(1)) + 1;
  return 'C' + numPart.toString().padStart(6, '0');
}

// Generate unique account ID: [type_code]-[branch code]-[last 3 digits of employee_id]-[5 digit sequence]
// Sequence is global per branch, employee, and account type
async function generateAccountId(client = pool, accountTypeId, branchId, employeeId) {
  const typeResult = await client.query(
    'SELECT type_code FROM account_type WHERE account_type_id = $1',
    [accountTypeId]
  );

  if (typeResult.rows.length === 0) {
    throw new Error('Invalid account type');
  }

  const typeCode = typeResult.rows[0].type_code;
  const branchStr = branchId.toString().padStart(3, '0');
  const agentStr = employeeId.toString().slice(-3).padStart(3, '0');
  
  // Get the maximum sequence number for this branch, employee, and account type combination
  const seqResult = await client.query(
    `SELECT MAX(CAST(SUBSTRING(account_id FROM '-(\\d{5})$') AS INTEGER)) as max_seq
     FROM account 
     WHERE account_id LIKE $1`,
    [`${typeCode}-${branchStr}-${agentStr}-%`]
  );

  const maxSeq = seqResult.rows[0].max_seq || 0;
  const seq = maxSeq + 1;
  const seqStr = seq.toString().padStart(5, '0');

  return `${typeCode}-${branchStr}-${agentStr}-${seqStr}`;
}

// 🔹 Helper: Get branch_id for employee
async function getBranchIdByEmployee(employeeId, client = pool) {
  const result = await client.query(
    `SELECT branch_id FROM branch 
     WHERE branch_id = (
       SELECT branch_id FROM employee WHERE employee_id = $1
     )`,
    [employeeId]
  );

  if (result.rows.length === 0) {
    throw new Error('Branch not found for employee');
  }

  return result.rows[0].branch_id;
}

// Get all account types (excluding fixed deposit)
router.get('/account-types', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT account_type_id, account_type_name, interest_rate, 
              min_age, max_age, minimum_balance
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

// Check if customer exists by NIC
router.get('/customer/check/:nic', authenticateToken, async (req, res) => {
  const { nic } = req.params;
  try {
    const result = await pool.query(
      `SELECT customer_id, first_name, last_name, nic_number, 
              date_of_birth, gender, phone_number, email, address, status
       FROM customer
       WHERE nic_number = $1`,
      [nic]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error checking customer:', err);
    res.status(500).json({ error: 'Failed to check customer' });
  }
});

// Create new customer
router.post('/customer', authenticateToken, async (req, res) => {
  const {
    firstName, lastName, nicNumber, dateOfBirth,
    gender, phoneNumber, email, address
  } = req.body;

  const agentId = req.user.employee_id;

  if (!firstName || !lastName || !nicNumber || !dateOfBirth ||
      !gender || !phoneNumber || !email || !address) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingCustomer = await client.query(
      'SELECT customer_id FROM customer WHERE nic_number = $1',
      [nicNumber]
    );

    if (existingCustomer.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Customer with this NIC already exists',
        customer_id: existingCustomer.rows[0].customer_id
      });
    }

    const customerId = await generateCustomerId(client);

    const result = await client.query(
      `INSERT INTO customer (
        customer_id, agent_id, first_name, last_name, nic_number,
        date_of_birth, gender, phone_number, email, address,
        registration_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, 'ACTIVE')
      RETURNING customer_id, first_name, last_name, nic_number`,
      [customerId, agentId, firstName, lastName, nicNumber, dateOfBirth,
        gender.toUpperCase(), phoneNumber, email, address]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Customer created successfully',
      customer: result.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating customer:', err);
    res.status(500).json({ error: 'Failed to create customer' });
  } finally {
    client.release();
  }
});

// Open new account
router.post('/account/open', authenticateToken, async (req, res) => {
  const { customerId, accountTypeId, initialDeposit } = req.body;

  if (!customerId || !accountTypeId || !initialDeposit) {
    return res.status(400).json({ error: 'Customer ID, account type, and initial deposit are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const branchId = await getBranchIdByEmployee(req.user.employee_id, client);

    const customerCheck = await client.query(
      'SELECT status FROM customer WHERE customer_id = $1',
      [customerId]
    );
    if (customerCheck.rows.length === 0) throw new Error('Customer not found');
    if (customerCheck.rows[0].status !== 'ACTIVE') throw new Error('Customer account is not active');

    const accountType = await client.query(
      'SELECT minimum_balance FROM account_type WHERE account_type_id = $1',
      [accountTypeId]
    );
    if (accountType.rows.length === 0) throw new Error('Invalid account type');

    const minBalance = parseFloat(accountType.rows[0].minimum_balance);
    const deposit = parseFloat(initialDeposit);
    if (deposit < minBalance) throw new Error(`Initial deposit must be at least ${minBalance}`);

    const accountId = await generateAccountId(client, accountTypeId, branchId, req.user.employee_id);

    // UPDATED: Set initial current_balance to 0 (let transaction add the deposit)
    await client.query(
      `INSERT INTO account (
        account_id, branch_id, account_type_id, 
        current_balance, status
      ) VALUES ($1, $2, $3, 0, 'ACTIVE')`,
      [accountId, branchId, accountTypeId]
    );

    await client.query(
      `INSERT INTO account_holder (
        customer_id, account_id, created_at
      ) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [customerId, accountId]
    );

    // Record initial deposit transaction
    const { transactionId, referenceNumber } = await recordInitialDeposit(
      client,
      accountId,
      deposit,
      'Initial deposit for account opening'
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Account opened successfully',
      account: {
        account_id: accountId,
        customer_id: customerId,
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
    console.error('Error opening account:', err);
    res.status(400).json({ error: err.message || 'Failed to open account' });
  } finally {
    client.release();
  }
});

// Register customer + open account
router.post('/account/register-and-open', authenticateToken, async (req, res) => {
  const {
    firstName, lastName, nicNumber, dateOfBirth, gender,
    phoneNumber, email, address, accountTypeId, initialDeposit
  } = req.body;

  const agentId = req.user.employee_id;

  if (!firstName || !lastName || !nicNumber || !dateOfBirth ||
      !gender || !phoneNumber || !email || !address || !accountTypeId || !initialDeposit) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const branchId = await getBranchIdByEmployee(agentId, client);

    let customerId;
    const existingCustomer = await client.query(
      'SELECT customer_id, status FROM customer WHERE nic_number = $1',
      [nicNumber]
    );

    if (existingCustomer.rows.length > 0) {
      customerId = existingCustomer.rows[0].customer_id;
      if (existingCustomer.rows[0].status !== 'ACTIVE') {
        throw new Error('Existing customer account is not active');
      }
    } else {
      customerId = await generateCustomerId(client);
      await client.query(
        `INSERT INTO customer (
          customer_id, agent_id, first_name, last_name, nic_number,
          date_of_birth, gender, phone_number, email, address,
          registration_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, 'ACTIVE')`,
        [customerId, agentId, firstName, lastName, nicNumber, dateOfBirth,
          gender.toUpperCase(), phoneNumber, email, address]
      );
    }

    const accountType = await client.query(
      'SELECT minimum_balance FROM account_type WHERE account_type_id = $1',
      [accountTypeId]
    );
    if (accountType.rows.length === 0) throw new Error('Invalid account type');

    const minBalance = parseFloat(accountType.rows[0].minimum_balance);
    const deposit = parseFloat(initialDeposit);
    if (deposit < minBalance) throw new Error(`Initial deposit must be at least ${minBalance}`);

    const accountId = await generateAccountId(client, accountTypeId, branchId, agentId);

    // UPDATED: Set initial current_balance to 0 (let transaction add the deposit)
    await client.query(
      `INSERT INTO account (
        account_id, branch_id, account_type_id, 
        current_balance, status
      ) VALUES ($1, $2, $3, 0, 'ACTIVE')`,
      [accountId, branchId, accountTypeId]
    );

    await client.query(
      `INSERT INTO account_holder (
        customer_id, account_id, created_at
      ) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [customerId, accountId]
    );

    // Record initial deposit transaction
    const { transactionId, referenceNumber } = await recordInitialDeposit(
      client,
      accountId,
      deposit,
      'Initial deposit for new account'
    );

    await client.query('COMMIT');

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

// Register multiple customers + open joint account
router.post('/account/joint/open', authenticateToken, async (req, res) => {
  const {
    customers,
    accountTypeId,
    initialDeposit
  } = req.body;

  const agentId = req.user.employee_id;

  if (!customers || !Array.isArray(customers) || customers.length < 2 || customers.length > 6) {
    return res.status(400).json({ error: 'Joint accounts require 2-6 customers' });
  }

  if (!accountTypeId || !initialDeposit) {
    return res.status(400).json({ error: 'Account type and initial deposit are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const branchId = await getBranchIdByEmployee(agentId, client);

    // Validate account type
    const accountType = await client.query(
      'SELECT minimum_balance, account_type_name FROM account_type WHERE account_type_id = $1',
      [accountTypeId]
    );
    if (accountType.rows.length === 0) throw new Error('Invalid account type');

    // Check if it's actually a joint account type
    const accountTypeName = accountType.rows[0].account_type_name.toLowerCase();
    if (!accountTypeName.includes('joint')) {
      throw new Error('Selected account type is not a joint account');
    }

    const minBalance = parseFloat(accountType.rows[0].minimum_balance);
    const deposit = parseFloat(initialDeposit);
    if (deposit < minBalance) throw new Error(`Initial deposit must be at least ${minBalance}`);

    // Process each customer
    const processedCustomers = [];
    const customerIds = [];

    for (const customerData of customers) {
      const {
        firstName,
        lastName,
        nicNumber,
        dateOfBirth,
        gender,
        phoneNumber,
        email,
        address,
        customerId: existingCustomerId
      } = customerData;

      // Validate required fields
      if (!firstName || !lastName || !nicNumber || !dateOfBirth ||
          !gender || !phoneNumber || !email || !address) {
        throw new Error('All customer fields are required');
      }

      let customerId = existingCustomerId;

      // Check if customer already exists by NIC
      if (!customerId) {
        const existingCustomer = await client.query(
          'SELECT customer_id, status FROM customer WHERE nic_number = $1',
          [nicNumber]
        );

        if (existingCustomer.rows.length > 0) {
          customerId = existingCustomer.rows[0].customer_id;
          if (existingCustomer.rows[0].status !== 'ACTIVE') {
            throw new Error(`Customer account for ${nicNumber} is not active`);
          }
        } else {
          // Create new customer
          customerId = await generateCustomerId(client);
          await client.query(
            `INSERT INTO customer (
              customer_id, agent_id, first_name, last_name, nic_number,
              date_of_birth, gender, phone_number, email, address,
              registration_date, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, 'ACTIVE')`,
            [customerId, agentId, firstName, lastName, nicNumber, dateOfBirth,
              gender.toUpperCase(), phoneNumber, email, address]
          );
        }
      } else {
        // Verify existing customer is active
        const customerCheck = await client.query(
          'SELECT status FROM customer WHERE customer_id = $1',
          [customerId]
        );
        if (customerCheck.rows.length === 0) throw new Error(`Customer not found: ${customerId}`);
        if (customerCheck.rows[0].status !== 'ACTIVE') throw new Error(`Customer account is not active: ${customerId}`);
      }

      customerIds.push(customerId);
      processedCustomers.push({
        customer_id: customerId,
        first_name: firstName,
        last_name: lastName,
        nic_number: nicNumber
      });
    }

    // Check for duplicate customers in the same joint account
    const uniqueCustomerIds = new Set(customerIds);
    if (uniqueCustomerIds.size !== customerIds.length) {
      throw new Error('Duplicate customers are not allowed in joint accounts');
    }

    // Generate joint account ID
    const accountId = await generateAccountId(client, accountTypeId, branchId, agentId);

    // Create the joint account
    // UPDATED: Set initial current_balance to 0 (let transaction add the deposit)
    await client.query(
      `INSERT INTO account (
        account_id, branch_id, account_type_id, 
        current_balance, status
      ) VALUES ($1, $2, $3, 0, 'ACTIVE')`,
      [accountId, branchId, accountTypeId]
    );

    // Create account holder relationships for all customers
    for (const customerId of customerIds) {
      await client.query(
        `INSERT INTO account_holder (
          customer_id, account_id, created_at
        ) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [customerId, accountId]
      );
    }

    // Record initial deposit transaction for joint account
    const { transactionId, referenceNumber } = await recordInitialDeposit(
      client,
      accountId,
      deposit,
      `Initial deposit for joint account (${customerIds.length} holders)`
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Joint account opened successfully',
      customers: processedCustomers,
      account: {
        account_id: accountId,
        account_type_id: accountTypeId,
        account_type_name: accountType.rows[0].account_type_name,
        initial_balance: deposit,
        status: 'ACTIVE',
        number_of_holders: customerIds.length
      },
      transaction: {
        transaction_id: transactionId,
        reference_number: referenceNumber
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error opening joint account:', err);
    res.status(400).json({ error: err.message || 'Failed to open joint account' });
  } finally {
    client.release();
  }
});

module.exports = router;