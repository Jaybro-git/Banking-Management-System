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

module.exports = router;
