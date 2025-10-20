const express = require('express');
const router = express.Router();
const AccountService = require('../services/accountService');

// ✅ 1. Check eligible account types
router.post('/eligible-types', (req, res) => {
  try {
    const { date_of_birth } = req.body;

    if (!date_of_birth) {
      return res.status(400).json({
        success: false,
        error: 'Date of birth is required'
      });
    }

    const { age, eligibleAccount } = AccountService.checkEligibility(date_of_birth);

    res.json({
      success: true,
      age: age,
      eligible_account: eligibleAccount
    });

  } catch (error) {
    console.error('Eligible types error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ✅ 2. Open Savings Account
router.post('/open', (req, res) => {
  try {
    const result = AccountService.openAccount(req.body);

    res.status(201).json({
      success: true,
      message: 'Account opened successfully',
      account: result.account,
      customer_age: result.customer_age
    });

  } catch (error) {
    console.error('Account opening error:', error);
    
    if (error.message.includes('not found') || error.message.includes('not eligible') || error.message.includes('Minimum')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ✅ 3. Get all accounts
router.get('/', (req, res) => {
  try {
    const accounts = AccountService.getAllAccounts();

    res.json({
      success: true,
      accounts: accounts,
      total: accounts.length
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ✅ 4. Get account by ID
router.get('/:id', (req, res) => {
  try {
    const account = AccountService.getAccountById(req.params.id);

    res.json({
      success: true,
      account: account
    });
  } catch (error) {
    console.error('Get account error:', error);
    
    if (error.message === 'Account not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ✅ 5. Get accounts by customer ID
router.get('/customer/:customerId', (req, res) => {
  try {
    const result = AccountService.getAccountsByCustomer(req.params.customerId);

    res.json({
      success: true,
      customer: result.customer,
      accounts: result.accounts,
      total: result.accounts.length
    });
  } catch (error) {
    console.error('Get customer accounts error:', error);
    
    if (error.message === 'Customer not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ✅ 6. Close account
router.put('/:id/close', (req, res) => {
  try {
    const account = AccountService.closeAccount(req.params.id);

    res.json({
      success: true,
      message: 'Account closed successfully',
      account: account
    });
  } catch (error) {
    console.error('Close account error:', error);
    
    if (error.message === 'Account not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;