const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user in user_account table
    const userResult = await pool.query(
      `SELECT u.*, e.employee_id, e.first_name, e.last_name, e.role, e.branch_id 
       FROM user_account u 
       JOIN employee e ON u.employee_id = e.employee_id 
       WHERE u.username = $1 AND e.status = 'active'`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Verify password (you should hash passwords in your database)
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { 
        username: user.username, 
        employee_id: user.employee_id,
        role: user.role,
        branch_id: user.branch_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        username: user.username,
        employee_id: user.employee_id,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        branch_id: user.branch_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;