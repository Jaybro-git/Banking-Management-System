const express = require('express');
const router = express.Router();
const TransactionService = require('../services/transactionService');

// ✅ 1. Deposit money into account
router.post('/deposit', (req, res) => {
  try {
    const { account_id, amount, description } = req.body;

    // Validate required fields
    if (!account_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: account_id, amount'
      });
    }

    const result = TransactionService.deposit({
      account_id,
      amount,
      description
    });

    res.status(200).json({
      success: true,
      message: 'Deposit successful',
      transaction: result.transaction,
      account: {
        account_number: result.account.account_number,
        new_balance: result.account.balance
      }
    });

  } catch (error) {
    console.error('Deposit error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('greater than 0') ||
        error.message.includes('Insufficient')) {
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

// ✅ 2. Withdraw money from account
router.post('/withdraw', (req, res) => {
  try {
    const { account_id, amount, description } = req.body;

    // Validate required fields
    if (!account_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: account_id, amount'
      });
    }

    const result = TransactionService.withdraw({
      account_id,
      amount,
      description
    });

    res.status(200).json({
      success: true,
      message: 'Withdrawal successful',
      transaction: result.transaction,
      account: {
        account_number: result.account.account_number,
        new_balance: result.account.balance
      }
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('greater than 0') ||
        error.message.includes('Insufficient')) {
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

// ✅ 3. Transfer money between accounts
router.post('/transfer', (req, res) => {
  try {
    const { from_account_id, to_account_id, amount, description } = req.body;

    // Validate required fields
    if (!from_account_id || !to_account_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: from_account_id, to_account_id, amount'
      });
    }

    const result = TransactionService.transfer({
      from_account_id,
      to_account_id,
      amount,
      description
    });

    res.status(200).json({
      success: true,
      message: 'Transfer successful',
      transfer_details: {
        from_transaction: result.from_transaction,
        to_transaction: result.to_transaction,
        from_account: {
          account_number: result.from_account.account_number,
          new_balance: result.from_account.balance
        },
        to_account: {
          account_number: result.to_account.account_number,
          new_balance: result.to_account.balance
        }
      }
    });

  } catch (error) {
    console.error('Transfer error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('greater than 0') ||
        error.message.includes('Insufficient')) {
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

// ✅ 4. Get transaction history for an account
router.get('/history/:account_id', (req, res) => {
  try {
    const { account_id } = req.params;

    const result = TransactionService.getTransactionHistory(account_id);

    res.status(200).json({
      success: true,
      account: result.account,
      transactions: result.transactions,
      total_transactions: result.total
    });

  } catch (error) {
    console.error('Transaction history error:', error);
    
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

// ✅ 5. Get account balance
router.get('/balance/:account_id', (req, res) => {
  try {
    const { account_id } = req.params;

    const result = TransactionService.getAccountBalance(account_id);

    res.status(200).json({
      success: true,
      balance: result
    });

  } catch (error) {
    console.error('Balance check error:', error);
    
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

// ✅ 6. Get all transactions (admin view)
router.get('/', (req, res) => {
  try {
    const { getData } = require('../data/store');
    const data = getData();

    res.status(200).json({
      success: true,
      transactions: data.transactions,
      total: data.transactions.length
    });

  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;