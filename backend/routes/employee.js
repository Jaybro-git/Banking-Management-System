const express = require('express');
const pool = require('../db/index');
const bcrypt = require('bcrypt');

const router = express.Router();
const SALT_ROUNDS = 10;

// Generate employee_id
async function generateEmployeeId(role) {
  const startId = role.toUpperCase() === 'MANAGER' ? '00001' : '00101';
  const result = await pool.query(
    'SELECT employee_id FROM employee WHERE role = $1 ORDER BY employee_id DESC LIMIT 1',
    [role.toUpperCase()]
  );

  if (result.rows.length === 0) return startId;
  const lastId = parseInt(result.rows[0].employee_id, 10);
  return (lastId + 1).toString().padStart(5, '0');
}

router.post('/register', async (req, res) => {
  const { firstName, lastName, email, nic, password, role, branch, phone, username } = req.body;

  if (!firstName || !lastName || !email || !nic || !password || !role || !branch || !phone || !username) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start transaction

    // Check if username exists
    const checkUser = await client.query(
      'SELECT 1 FROM user_account WHERE username = $1',
      [username]
    );
    if (checkUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const employeeId = await generateEmployeeId(role);

    // Insert employee
    const employeeResult = await client.query(
      `INSERT INTO employee (employee_id, branch_id, first_name, last_name, nic_number, phone_number, email, hire_date, status, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'ACTIVE', $8)
       RETURNING *`,
      [employeeId, branch, firstName, lastName, nic, phone, email, role.toUpperCase()]
    );

    // Insert user account
    await client.query(
      `INSERT INTO user_account (username, employee_id, password_hash, refresh_token)
       VALUES ($1, $2, $3, NULL)`,
      [username, employeeId, hashedPassword]
    );

    await client.query('COMMIT');
    res.status(201).json({ employee: employeeResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error registering employee:', err);

    if (err.code === '23505') {
      res.status(400).json({ error: 'Duplicate entry', details: err.detail });
    } else {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  } finally {
    client.release();
  }
});

module.exports = router;
