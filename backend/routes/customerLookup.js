// backend/routes/customerLookup.js
const express = require('express');
const pool = require('../db/index');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Get customers with filtering and search
router.get('/customers', authenticateToken, async (req, res) => {
  const { 
    filterType = 'All', 
    searchField = 'account', 
    searchQuery = '',
    limit = 100,
    offset = 0 
  } = req.query;

  const agentId = req.user.employee_id;

  try {
    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;

    // Apply filter type conditions
    switch (filterType) {
      case 'Adult Accounts':
        whereConditions.push(`EXISTS (
          SELECT 1 FROM account_holder ah2 
          JOIN account a2 ON ah2.account_id = a2.account_id 
          WHERE ah2.customer_id = c.customer_id 
          AND a2.account_id LIKE 'AA-%'
        )`);
        break;
      case 'Joint Accounts':
        whereConditions.push(`EXISTS (
          SELECT 1 FROM account_holder ah2 
          JOIN account a2 ON ah2.account_id = a2.account_id 
          WHERE ah2.customer_id = c.customer_id 
          AND a2.account_id LIKE 'JA-%'
        )`);
        break;
      case 'Fixed Deposits':
        whereConditions.push(`EXISTS (
          SELECT 1 FROM account_holder ah2 
          JOIN account a2 ON ah2.account_id = a2.account_id 
          WHERE ah2.customer_id = c.customer_id 
          AND a2.account_id LIKE 'FD-%'
        )`);
        break;
      case 'Children Accounts':
        whereConditions.push(`EXISTS (
          SELECT 1 FROM account_holder ah2 
          JOIN account a2 ON ah2.account_id = a2.account_id 
          WHERE ah2.customer_id = c.customer_id 
          AND a2.account_id LIKE 'CA-%'
        )`);
        break;
      case 'Teen Accounts':
        whereConditions.push(`EXISTS (
          SELECT 1 FROM account_holder ah2 
          JOIN account a2 ON ah2.account_id = a2.account_id 
          WHERE ah2.customer_id = c.customer_id 
          AND a2.account_id LIKE 'TA-%'
        )`);
        break;
      case 'Senior Accounts':
        whereConditions.push(`EXISTS (
          SELECT 1 FROM account_holder ah2 
          JOIN account a2 ON ah2.account_id = a2.account_id 
          WHERE ah2.customer_id = c.customer_id 
          AND a2.account_id LIKE 'SA-%'
        )`);
        break;
      case 'Processed by Me':
        whereConditions.push(`c.agent_id = $${paramCounter}`);
        queryParams.push(agentId);
        paramCounter++;
        break;
      case 'All':
      default:
        // No additional filter - show all customers
        break;
    }

    // Apply search query
    if (searchQuery && searchQuery.trim() !== '') {
      const searchTerm = `%${searchQuery.trim().toLowerCase()}%`;
      
      switch (searchField) {
        case 'account':
          whereConditions.push(`EXISTS (
            SELECT 1 FROM account_holder ah2 
            JOIN account a2 ON ah2.account_id = a2.account_id 
            WHERE ah2.customer_id = c.customer_id 
            AND LOWER(a2.account_id) LIKE $${paramCounter}
          )`);
          queryParams.push(searchTerm);
          paramCounter++;
          break;
        case 'customer':
          whereConditions.push(`(LOWER(c.first_name) LIKE $${paramCounter} OR LOWER(c.last_name) LIKE $${paramCounter} OR LOWER(CONCAT(c.first_name, ' ', c.last_name)) LIKE $${paramCounter})`);
          queryParams.push(searchTerm);
          paramCounter++;
          break;
        case 'nic':
          whereConditions.push(`LOWER(c.nic_number) LIKE $${paramCounter}`);
          queryParams.push(searchTerm);
          paramCounter++;
          break;
      }
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Get all customers (one per customer, not per account)
    const customersQuery = `
      SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        c.nic_number,
        c.phone_number,
        c.email,
        c.status as customer_status,
        c.registration_date
      FROM customer c
      ${whereClause}
      ORDER BY c.customer_id
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    queryParams.push(limit, offset);

    const customersResult = await pool.query(customersQuery, queryParams);

    // For each customer, get all their accounts
    const customersWithAccounts = await Promise.all(
      customersResult.rows.map(async (customer) => {
        const accountsQuery = `
          SELECT 
            a.account_id,
            a.current_balance,
            a.status as account_status,
            at.account_type_name,
            at.type_code,
            b.branch_name,
            ah.created_at as account_created_at,
            t.transaction_type as last_transaction_type,
            t.amount as last_transaction_amount,
            t.time_date_stamp as last_transaction_date
          FROM account_holder ah
          JOIN account a ON ah.account_id = a.account_id
          JOIN account_type at ON a.account_type_id = at.account_type_id
          LEFT JOIN branch b ON a.branch_id = b.branch_id
          LEFT JOIN LATERAL (
            SELECT transaction_type, amount, time_date_stamp
            FROM transaction
            WHERE account_id = a.account_id
            ORDER BY time_date_stamp DESC
            LIMIT 1
          ) t ON true
          WHERE ah.customer_id = $1
          ORDER BY ah.created_at DESC
        `;

        const accountsResult = await pool.query(accountsQuery, [customer.customer_id]);

        return {
          ...customer,
          accounts: accountsResult.rows,
          total_accounts: accountsResult.rows.length,
          total_balance: accountsResult.rows.reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0)
        };
      })
    );

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT c.customer_id) as total
      FROM customer c
      ${whereClause}
    `;

    const countResult = await pool.query(
      countQuery, 
      queryParams.slice(0, paramCounter - 1)
    );

    res.json({
      customers: customersWithAccounts,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get detailed customer profile
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  const { customerId } = req.params;

  try {
    // Get customer details
    const customerResult = await pool.query(
      `SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        c.nic_number,
        c.date_of_birth,
        c.gender,
        c.phone_number,
        c.email,
        c.address,
        c.registration_date,
        c.status,
        e.first_name as agent_first_name,
        e.last_name as agent_last_name
       FROM customer c
       LEFT JOIN employee e ON c.agent_id = e.employee_id
       WHERE c.customer_id = $1`,
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get all accounts for this customer
    const accountsResult = await pool.query(
      `SELECT 
        a.account_id,
        a.current_balance,
        a.status,
        at.account_type_name,
        at.type_code,
        at.interest_rate,
        b.branch_name,
        ah.created_at as account_created_at
       FROM account_holder ah
       JOIN account a ON ah.account_id = a.account_id
       JOIN account_type at ON a.account_type_id = at.account_type_id
       LEFT JOIN branch b ON a.branch_id = b.branch_id
       WHERE ah.customer_id = $1
       ORDER BY ah.created_at DESC`,
      [customerId]
    );

    res.json({
      customer: customerResult.rows[0],
      accounts: accountsResult.rows
    });
  } catch (err) {
    console.error('Error fetching customer profile:', err);
    res.status(500).json({ error: 'Failed to fetch customer profile' });
  }
});

// Get all account holders for a specific account (for joint accounts)
router.get('/account/:accountId/holders', authenticateToken, async (req, res) => {
  const { accountId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        c.nic_number,
        c.phone_number,
        c.email,
        ah.created_at
       FROM account_holder ah
       JOIN customer c ON ah.customer_id = c.customer_id
       WHERE ah.account_id = $1
       ORDER BY ah.created_at ASC`,
      [accountId]
    );

    res.json({
      account_id: accountId,
      holders: result.rows,
      holder_count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching account holders:', err);
    res.status(500).json({ error: 'Failed to fetch account holders' });
  }
});

module.exports = router;