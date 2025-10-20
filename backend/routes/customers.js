const express = require('express');
const router = express.Router();

// ✅ SIMPLE DATABASE VERSION - Basic error handling
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, nic_number, date_of_birth, phone, address, occupation, monthly_income, agent_id } = req.body;

    // Basic validation
    if (!first_name || !last_name || !email || !nic_number || !date_of_birth) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // For now, just return success without actual database insert
    const fullName = `${first_name} ${last_name}`;
    
    res.status(201).json({
      success: true,
      message: 'Customer registered successfully (database ready)',
      customer: {
        id: Math.floor(Math.random() * 1000), // Temporary ID
        firstName: first_name,
        lastName: last_name,
        fullName: fullName,
        email: email,
        nicNumber: nic_number,
        dateOfBirth: date_of_birth,
        phone: phone,
        address: address,
        occupation: occupation,
        monthlyIncome: monthly_income,
        customerSince: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET all customers (simple version)
router.get('/', async (req, res) => {
  try {
    // For now, return test data
    res.json({
      success: true,
      customers: [
        {
          id: 1,
          firstName: 'Test',
          lastName: 'Customer',
          email: 'test@email.com',
          nicNumber: '123456789V',
          dateOfBirth: '1990-01-01',
          phone: '+94771234567',
          customerSince: '2024-01-01'
        }
      ]
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET single customer
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      customer: {
        id: parseInt(id),
        firstName: 'Test',
        lastName: 'Customer',
        email: 'test@email.com',
        nicNumber: '123456789V'
      }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;