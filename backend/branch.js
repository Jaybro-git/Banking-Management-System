// branch-management.js
const express = require('express');
const router = express.Router();
const pool = require('../db/index');
const authenticateToken = require('../middleware/auth');

// Valid branch status enum
const validStatus = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];
const validDistricts = ['Colombo', 'Gampaha', 'Kandy', 'Galle', 'Matara', 'Jaffna', 'Trincomalee'];

// Register new branch with authentication
router.post('/register', authenticateToken, async (req, res) => {
  let { branchName, address, district, phoneNumber, email, establishedDate, status } = req.body;

  // Validation
  if (!branchName || !address || !district) {
    return res.status(400).json({ 
      error: 'Branch name, address, and district are required' 
    });
  }

  if (!validDistricts.includes(district)) {
    return res.status(400).json({ 
      error: 'Invalid district', 
      validDistricts 
    });
  }

  // Default status to 'ACTIVE' if not valid
  if (!validStatus.includes(status)) {
    status = 'ACTIVE';
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get last numeric branch_id with better error handling
    const result = await client.query(`
      SELECT branch_id 
      FROM branch 
      WHERE branch_id ~ '^\\d+$'
      ORDER BY CAST(branch_id AS INTEGER) DESC 
      LIMIT 1
    `);

    let newId = '001';
    if (result.rows.length > 0) {
      const lastId = parseInt(result.rows[0].branch_id, 10);
      newId = String(lastId + 1).padStart(3, '0');
      
      // Prevent ID overflow
      if (newId.length > 3) {
        throw new Error('Maximum branch limit reached');
      }
    }

    // Check for duplicate branch name in same district
    const duplicateCheck = await client.query(
      `SELECT branch_id FROM branch 
       WHERE branch_name = $1 AND district = $2`,
      [branchName, district]
    );

    if (duplicateCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: 'Branch with this name already exists in the district' 
      });
    }

    // Insert branch
    const insertQuery = `
      INSERT INTO branch 
        (branch_id, branch_name, address, district, phone_number, email, established_date, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const values = [
      newId,
      branchName.trim(),
      address.trim(),
      district,
      phoneNumber ? phoneNumber.replace(/\D/g, '') : null, // Clean phone number
      email ? email.toLowerCase().trim() : null,
      establishedDate || new Date().toISOString().split('T')[0],
      status
    ];

    const newBranch = await client.query(insertQuery, values);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Branch registered successfully',
      branch: newBranch.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error inserting branch:', err);
    
    if (err.message.includes('maximum branch limit')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ 
        error: 'Database error', 
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  } finally {
    client.release();
  }
});

// Get all branches with optional filtering
router.get('/', authenticateToken, async (req, res) => {
  const { status, district, search } = req.query;

  try {
    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;

    // Add status filter
    if (status && validStatus.includes(status)) {
      whereConditions.push(`status = $${paramCounter}`);
      queryParams.push(status);
      paramCounter++;
    }

    // Add district filter
    if (district && validDistricts.includes(district)) {
      whereConditions.push(`district = $${paramCounter}`);
      queryParams.push(district);
      paramCounter++;
    }

    // Add search filter
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      whereConditions.push(`(LOWER(branch_name) LIKE $${paramCounter} OR LOWER(address) LIKE $${paramCounter})`);
      queryParams.push(searchTerm);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const result = await pool.query(
      `SELECT 
        branch_id, 
        branch_name, 
        address, 
        district, 
        phone_number, 
        email, 
        established_date, 
        status,
        created_at
       FROM branch 
       ${whereClause}
       ORDER BY branch_name`,
      queryParams
    );

    res.json({ 
      branches: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching branches:', err);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Get branch by employee_id with enhanced info
router.get('/by-employee/:employee_id', authenticateToken, async (req, res) => {
  const { employee_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        b.branch_id, 
        b.branch_name,
        b.address,
        b.district,
        b.phone_number,
        b.email,
        b.status as branch_status,
        e.role,
        e.department
       FROM branch b
       JOIN employee e ON e.branch_id = b.branch_id
       WHERE e.employee_id = $1 AND e.status = 'ACTIVE'`,
      [employee_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Branch not found for this employee or employee is inactive' 
      });
    }

    res.json({ 
      branch: result.rows[0],
      employee_role: result.rows[0].role
    });
  } catch (err) {
    console.error('Error fetching branch by employee:', err);
    res.status(500).json({ error: 'Failed to fetch branch information' });
  }
});

// Update branch information
router.put('/:branchId', authenticateToken, async (req, res) => {
  const { branchId } = req.params;
  const { branchName, address, district, phoneNumber, email, status } = req.body;

  try {
    // Check if branch exists
    const branchCheck = await pool.query(
      'SELECT branch_id FROM branch WHERE branch_id = $1',
      [branchId]
    );

    if (branchCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Validate status if provided
    if (status && !validStatus.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status', 
        validStatus 
      });
    }

    // Validate district if provided
    if (district && !validDistricts.includes(district)) {
      return res.status(400).json({ 
        error: 'Invalid district', 
        validDistricts 
      });
    }

    const updateQuery = `
      UPDATE branch 
      SET 
        branch_name = COALESCE($1, branch_name),
        address = COALESCE($2, address),
        district = COALESCE($3, district),
        phone_number = COALESCE($4, phone_number),
        email = COALESCE($5, email),
        status = COALESCE($6, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE branch_id = $7
      RETURNING *
    `;

    const values = [
      branchName ? branchName.trim() : null,
      address ? address.trim() : null,
      district || null,
      phoneNumber ? phoneNumber.replace(/\D/g, '') : null,
      email ? email.toLowerCase().trim() : null,
      status || null,
      branchId
    ];

    const updatedBranch = await pool.query(updateQuery, values);

    res.json({
      message: 'Branch updated successfully',
      branch: updatedBranch.rows[0]
    });
  } catch (err) {
    console.error('Error updating branch:', err);
    res.status(500).json({ error: 'Failed to update branch' });
  }
});

// Get comprehensive branch analytics
router.get('/:branchId/analytics', authenticateToken, async (req, res) => {
  const { branchId } = req.params;

  try {
    // Verify branch exists
    const branchCheck = await pool.query(
      'SELECT branch_name FROM branch WHERE branch_id = $1',
      [branchId]
    );

    if (branchCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Multiple analytics queries in parallel
    const [
      agentsResult,
      customersResult,
      accountsResult,
      employeesResult,
      totalBalanceResult,
      monthlyGrowthResult
    ] = await Promise.all([
      // Active agents count
      pool.query(
        `SELECT COUNT(*) as count
         FROM employee 
         WHERE branch_id = $1 AND role = 'AGENT' AND status = 'ACTIVE'`,
        [branchId]
      ),
      
      // Active customers count
      pool.query(
        `SELECT COUNT(DISTINCT c.customer_id) as count
         FROM customer c
         JOIN account_holder ah ON ah.customer_id = c.customer_id
         JOIN account a ON a.account_id = ah.account_id
         WHERE a.branch_id = $1 AND c.status = 'ACTIVE' AND a.status = 'ACTIVE'`,
        [branchId]
      ),
      
      // Active accounts count by type
      pool.query(
        `SELECT 
          at.account_type_name,
          COUNT(*) as count
         FROM account a
         JOIN account_type at ON a.account_type_id = at.account_type_id
         WHERE a.branch_id = $1 AND a.status = 'ACTIVE'
         GROUP BY at.account_type_name
         ORDER BY count DESC`,
        [branchId]
      ),
      
      // Employees list with details
      pool.query(
        `SELECT 
          employee_id, 
          first_name, 
          last_name, 
          role, 
          department,
          hire_date,
          email
         FROM employee 
         WHERE branch_id = $1 AND status = 'ACTIVE'
         ORDER BY role, first_name, last_name`,
        [branchId]
      ),
      
      // Total branch balance
      pool.query(
        `SELECT COALESCE(SUM(current_balance), 0) as total_balance
         FROM account 
         WHERE branch_id = $1 AND status = 'ACTIVE'`,
        [branchId]
      ),
      
      // Monthly customer growth (last 6 months)
      pool.query(
        `SELECT 
          DATE_TRUNC('month', registration_date) as month,
          COUNT(*) as new_customers
         FROM customer c
         JOIN account_holder ah ON c.customer_id = ah.customer_id
         JOIN account a ON ah.account_id = a.account_id
         WHERE a.branch_id = $1 
           AND c.registration_date >= CURRENT_DATE - INTERVAL '6 months'
         GROUP BY DATE_TRUNC('month', registration_date)
         ORDER BY month DESC
         LIMIT 6`,
        [branchId]
      )
    ]);

    const analytics = {
      branch_name: branchCheck.rows[0].branch_name,
      summary: {
        agents: parseInt(agentsResult.rows[0].count, 10),
        customers: parseInt(customersResult.rows[0].count, 10),
        total_balance: parseFloat(totalBalanceResult.rows[0].total_balance),
        total_employees: employeesResult.rows.length
      },
      accounts_by_type: accountsResult.rows.map(row => ({
        type: row.account_type_name,
        count: parseInt(row.count, 10)
      })),
      employees: employeesResult.rows,
      monthly_growth: monthlyGrowthResult.rows.map(row => ({
        month: row.month.toISOString().split('T')[0],
        new_customers: parseInt(row.new_customers, 10)
      }))
    };

    res.json(analytics);
  } catch (err) {
    console.error('Error fetching branch analytics:', err);
    res.status(500).json({ error: 'Failed to fetch branch analytics' });
  }
});

// Get available districts
router.get('/meta/districts', authenticateToken, (req, res) => {
  res.json({ districts: validDistricts });
});

// Get branch status options
router.get('/meta/statuses', authenticateToken, (req, res) => {
  res.json({ statuses: validStatus });
});

module.exports = router;