const express = require('express');
const pool = require('../db/index');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

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
        a.current_balance::float as current_balance,
        a.status as account_status,
        at.account_type_name,
        at.type_code,
        b.branch_name,
        ah.created_at as account_created_at,
        (SELECT transaction_type FROM transaction WHERE account_id = a.account_id ORDER BY time_date_stamp DESC LIMIT 1) as last_transaction_type,
        (SELECT amount FROM transaction WHERE account_id = a.account_id ORDER BY time_date_stamp DESC LIMIT 1) as last_transaction_amount,
        (SELECT time_date_stamp FROM transaction WHERE account_id = a.account_id ORDER BY time_date_stamp DESC LIMIT 1) as last_transaction_date,
        (SELECT employee_id FROM transaction WHERE account_id = a.account_id ORDER BY time_date_stamp DESC LIMIT 1) as last_transaction_employee_id
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
      accounts: accountsResult.rows,
      total_accounts: accountsResult.rows.length,
      total_balance: accountsResult.rows.reduce((sum, acc) => sum + Number(acc.current_balance), 0)
    });
  } catch (err) {
    console.error('Error fetching customer profile:', err);
    res.status(500).json({ error: 'Failed to fetch customer profile' });
  }
});

// Toggle customer active/inactive status
router.put('/customer/:customerId/status-toggle', authenticateToken, async (req, res) => {
  const { customerId } = req.params;

  try {
    const current = await pool.query(
      `SELECT status FROM customer WHERE customer_id = $1`,
      [customerId]
    );

    if (current.rows.length === 0)
      return res.status(404).json({ error: 'Customer not found' });

    const newStatus = current.rows[0].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    // Update customer status
    await pool.query(
      `UPDATE customer SET status = $1 WHERE customer_id = $2`,
      [newStatus, customerId]
    );

    res.json({ status: newStatus });
  } catch (err) {
    console.error('Error toggling customer status:', err);
    res.status(500).json({ error: 'Failed to toggle customer status' });
  }
});

// Toggle account active/inactive status
router.put('/account/:accountId/status-toggle', authenticateToken, async (req, res) => {
  const { accountId } = req.params;

  try {
    const current = await pool.query(
      `SELECT status FROM account WHERE account_id = $1`,
      [accountId]
    );

    if (current.rows.length === 0)
      return res.status(404).json({ error: 'Account not found' });

    const newStatus = current.rows[0].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    await pool.query(
      `UPDATE account SET status = $1 WHERE account_id = $2`,
      [newStatus, accountId]
    );

    res.json({ status: newStatus });
  } catch (err) {
    console.error('Error toggling account status:', err);
    res.status(500).json({ error: 'Failed to toggle account status' });
  }
});

// GET /api/profile/employee - Get current logged-in employee's profile
router.get('/employee', authenticateToken, async (req, res) => {
  const employeeId = req.user.employee_id;
  if (!employeeId) {
    return res.status(401).json({ error: 'Unauthorized: No employee ID in session' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        e.employee_id, e.first_name, e.last_name, e.nic_number, 
        e.phone_number, e.email, e.hire_date, e.status, e.salary, e.role,
        b.branch_name, b.address as branch_address,
        (SELECT COUNT(*) FROM public.customer WHERE agent_id = e.employee_id) as total_customers,
        (SELECT COUNT(*) FROM public.account_holder ah
         JOIN public.customer c ON ah.customer_id = c.customer_id
         WHERE c.agent_id = e.employee_id) as total_accounts,
        (SELECT COUNT(*) FROM public.transaction WHERE employee_id = e.employee_id) as total_transactions
      FROM public.employee e
      LEFT JOIN public.branch b ON e.branch_id = b.branch_id
      WHERE e.employee_id = $1
    `, [employeeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employeeData = result.rows[0];
    // Use branch address as employee address if not separate
    employeeData.address = employeeData.branch_address || 'N/A';

    res.json({ employee: employeeData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/profile/employee/:employeeId - Get specific employee's profile
router.get('/employee/:employeeId', authenticateToken, async (req, res) => {
  const { employeeId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        e.employee_id, e.first_name, e.last_name, e.nic_number, 
        e.phone_number, e.email, e.hire_date, e.status, e.salary, e.role,
        b.branch_name, b.address as branch_address,
        (SELECT COUNT(*) FROM public.customer WHERE agent_id = e.employee_id) as total_customers,
        (SELECT COUNT(*) FROM public.account_holder ah
         JOIN public.customer c ON ah.customer_id = c.customer_id
         WHERE c.agent_id = e.employee_id) as total_accounts,
        (SELECT COUNT(*) FROM public.transaction WHERE employee_id = e.employee_id) as total_transactions
      FROM public.employee e
      LEFT JOIN public.branch b ON e.branch_id = b.branch_id
      WHERE e.employee_id = $1
    `, [employeeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employeeData = result.rows[0];
    employeeData.address = employeeData.branch_address || 'N/A';

    res.json({ employee: employeeData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/profile/employee/:employeeId/report - Get report data for date range
router.get('/employee/:employeeId/report', authenticateToken, async (req, res) => {
  const { employeeId } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  try {
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const startTimestamp = `${startDate} 00:00:00`;
    const endTimestamp = `${endDate} 23:59:59`;

    // Get range customers
    const customersResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM public.customer 
      WHERE agent_id = $1 AND registration_date BETWEEN $2::date AND $3::date
    `, [employeeId, startDate, endDate]);

    // Get range accounts
    const accountsResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM public.account_holder ah
      JOIN public.customer c ON ah.customer_id = c.customer_id
      WHERE c.agent_id = $1 AND ah.created_at BETWEEN $2::timestamp::time AND $3::timestamp::time
    `, [employeeId, startTimestamp, endTimestamp]);

    // Get range transactions and list
    const transactionsResult = await pool.query(`
      SELECT 
        transaction_id, account_id, transaction_type, amount,
        time_date_stamp, description, reference_number
      FROM public.transaction 
      WHERE employee_id = $1 AND time_date_stamp BETWEEN $2::timestamp AND $3::timestamp
      ORDER BY time_date_stamp DESC
    `, [employeeId, startTimestamp, endTimestamp]);

    res.json({
      range_customers: parseInt(customersResult.rows[0].count),
      range_accounts: parseInt(accountsResult.rows[0].count),
      range_transactions: transactionsResult.rows.length,
      transactions: transactionsResult.rows
    });
  } catch (err) {
    console.error('Error generating employee report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;