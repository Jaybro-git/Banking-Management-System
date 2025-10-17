// branch.js
const express = require('express');
const router = express.Router();
const pool = require('../db/index');

// Valid branch status enum
const validStatus = ['ACTIVE', 'INACTIVE'];

// Register new branch
router.post('/register', async (req, res) => {
  let { branchName, address, district, phoneNumber, email, establishedDate, status } = req.body;

  // Default status to 'ACTIVE' if not valid
  if (!validStatus.includes(status)) {
    status = 'ACTIVE';
  }

  try {
    // Get last numeric branch_id
    const result = await pool.query(`
      SELECT branch_id 
      FROM branch
      ORDER BY branch_id::int DESC
      LIMIT 1
    `);

    let newId = '001';
    if (result.rows.length > 0) {
      const lastId = parseInt(result.rows[0].branch_id, 10);
      newId = String(lastId + 1).padStart(3, '0');
    }

    // Insert branch
    const insertQuery = `
      INSERT INTO branch 
        (branch_id, branch_name, address, district, phone_number, email, established_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const values = [
      newId,
      branchName,
      address || null,
      district || null,
      phoneNumber || null,
      email || null,
      establishedDate || null,
      status
    ];

    const newBranch = await pool.query(insertQuery, values);

    res.status(201).json({
      message: 'Branch registered successfully',
      branch: newBranch.rows[0]
    });
  } catch (err) {
    console.error('Error inserting branch:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get all branches
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT branch_id, branch_name, address, district, phone_number, email, established_date, status 
       FROM branch 
       ORDER BY branch_name`
    );
    res.json({ branches: result.rows });
  } catch (err) {
    console.error('Error fetching branches:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get branch by employee_id
router.get('/by-employee/:employee_id', async (req, res) => {
  const { employee_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT b.branch_id, b.branch_name
       FROM branch b
       JOIN employee e ON e.branch_id = b.branch_id
       WHERE e.employee_id = $1`,
      [employee_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found for this employee' });
    }

    res.json({ branch: result.rows[0] });
  } catch (err) {
    console.error('Error fetching branch by employee:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get branch details (agents, customers, accounts)
router.get('/:branchId/details', async (req, res) => {
  const { branchId } = req.params;

  try {
    // Total agents: active agents in this branch
    const agentsResult = await pool.query(
      `SELECT COUNT(*) 
       FROM employee 
       WHERE branch_id = $1 AND role = 'AGENT' AND status = 'ACTIVE'`,
      [branchId]
    );
    const agents = parseInt(agentsResult.rows[0].count, 10);

    // Total customers: distinct active customers with active accounts in this branch
    const customersResult = await pool.query(
      `SELECT COUNT(DISTINCT c.customer_id)
       FROM customer c
       JOIN account_holder ah ON ah.customer_id = c.customer_id
       JOIN account a ON a.account_id = ah.account_id
       WHERE a.branch_id = $1 AND c.status = 'ACTIVE' AND a.status = 'ACTIVE'`,
      [branchId]
    );
    const customers = parseInt(customersResult.rows[0].count, 10);

    // Total accounts: active accounts in this branch
    const accountsResult = await pool.query(
      `SELECT COUNT(*) 
       FROM account 
       WHERE branch_id = $1 AND status = 'ACTIVE'`,
      [branchId]
    );
    const accounts = parseInt(accountsResult.rows[0].count, 10);

    res.json({ agents, customers, accounts });
  } catch (err) {
    console.error('Error fetching branch details:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

module.exports = router;