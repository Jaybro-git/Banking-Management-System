const { getData, updateData } = require('../data/store');

class TransactionService {
  // Deposit money into account
  static deposit(transactionData) {
    try {
      console.log('💰 TransactionService.deposit called with:', transactionData);
      
      const { account_id, amount, description = '' } = transactionData;
      const data = getData();

      // Find account
      const accountIndex = data.accounts.findIndex(a => a.id === parseInt(account_id));
      if (accountIndex === -1) {
        throw new Error('Account not found');
      }

      // Validate amount
      if (parseFloat(amount) <= 0) {
        throw new Error('Deposit amount must be greater than 0');
      }

      const depositAmount = parseFloat(amount);
      const currentBalance = parseFloat(data.accounts[accountIndex].balance);
      const newBalance = currentBalance + depositAmount;

      // Update account balance
      data.accounts[accountIndex].balance = newBalance;

      // Create transaction record
      const transaction = {
        id: data.nextTransactionId++,
        account_id: parseInt(account_id),
        transaction_type: 'deposit',
        amount: depositAmount,
        balance_after: newBalance,
        description: description || `Deposit: LKR ${depositAmount}`,
        transaction_date: new Date().toISOString()
      };

      // Save transaction and update data
      data.transactions.push(transaction);
      updateData(data);

      console.log('✅ Deposit successful:', transaction);

      return {
        transaction: transaction,
        account: data.accounts[accountIndex]
      };

    } catch (error) {
      console.error('❌ TransactionService.deposit error:', error);
      throw error;
    }
  }

  // Withdraw money from account
  static withdraw(transactionData) {
    try {
      console.log('💸 TransactionService.withdraw called with:', transactionData);
      
      const { account_id, amount, description = '' } = transactionData;
      const data = getData();

      // Find account
      const accountIndex = data.accounts.findIndex(a => a.id === parseInt(account_id));
      if (accountIndex === -1) {
        throw new Error('Account not found');
      }

      const account = data.accounts[accountIndex];

      // Validate amount
      const withdrawAmount = parseFloat(amount);
      if (withdrawAmount <= 0) {
        throw new Error('Withdrawal amount must be greater than 0');
      }

      // Check sufficient balance
      const currentBalance = parseFloat(account.balance);
      const minimumBalance = parseFloat(account.minimum_balance);
      
      if (currentBalance - withdrawAmount < minimumBalance) {
        throw new Error(`Insufficient funds. Minimum balance requirement: LKR ${minimumBalance}`);
      }

      const newBalance = currentBalance - withdrawAmount;

      // Update account balance
      data.accounts[accountIndex].balance = newBalance;

      // Create transaction record
      const transaction = {
        id: data.nextTransactionId++,
        account_id: parseInt(account_id),
        transaction_type: 'withdrawal',
        amount: withdrawAmount,
        balance_after: newBalance,
        description: description || `Withdrawal: LKR ${withdrawAmount}`,
        transaction_date: new Date().toISOString()
      };

      // Save transaction and update data
      data.transactions.push(transaction);
      updateData(data);

      console.log('✅ Withdrawal successful:', transaction);

      return {
        transaction: transaction,
        account: data.accounts[accountIndex]
      };

    } catch (error) {
      console.error('❌ TransactionService.withdraw error:', error);
      throw error;
    }
  }

  // Transfer money between accounts
  static transfer(transferData) {
    try {
      console.log('🔄 TransactionService.transfer called with:', transferData);
      
      const { from_account_id, to_account_id, amount, description = '' } = transferData;
      const data = getData();

      // Find both accounts
      const fromAccountIndex = data.accounts.findIndex(a => a.id === parseInt(from_account_id));
      const toAccountIndex = data.accounts.findIndex(a => a.id === parseInt(to_account_id));

      if (fromAccountIndex === -1) {
        throw new Error('Sender account not found');
      }
      if (toAccountIndex === -1) {
        throw new Error('Receiver account not found');
      }

      const fromAccount = data.accounts[fromAccountIndex];
      const toAccount = data.accounts[toAccountIndex];

      // Validate amount
      const transferAmount = parseFloat(amount);
      if (transferAmount <= 0) {
        throw new Error('Transfer amount must be greater than 0');
      }

      // Check sufficient balance in sender account
      const fromCurrentBalance = parseFloat(fromAccount.balance);
      const fromMinBalance = parseFloat(fromAccount.minimum_balance);
      
      if (fromCurrentBalance - transferAmount < fromMinBalance) {
        throw new Error(`Insufficient funds for transfer. Minimum balance requirement: LKR ${fromMinBalance}`);
      }

      // Calculate new balances
      const fromNewBalance = fromCurrentBalance - transferAmount;
      const toNewBalance = parseFloat(toAccount.balance) + transferAmount;

      // Update account balances
      data.accounts[fromAccountIndex].balance = fromNewBalance;
      data.accounts[toAccountIndex].balance = toNewBalance;

      // Create transaction records for both accounts
      const fromTransaction = {
        id: data.nextTransactionId++,
        account_id: parseInt(from_account_id),
        transaction_type: 'transfer_out',
        amount: transferAmount,
        balance_after: fromNewBalance,
        description: description || `Transfer to ACC${toAccount.account_number}: LKR ${transferAmount}`,
        transaction_date: new Date().toISOString()
      };

      const toTransaction = {
        id: data.nextTransactionId++,
        account_id: parseInt(to_account_id),
        transaction_type: 'transfer_in',
        amount: transferAmount,
        balance_after: toNewBalance,
        description: description || `Transfer from ACC${fromAccount.account_number}: LKR ${transferAmount}`,
        transaction_date: new Date().toISOString()
      };

      // Save transactions and update data
      data.transactions.push(fromTransaction, toTransaction);
      updateData(data);

      console.log('✅ Transfer successful');

      return {
        from_transaction: fromTransaction,
        to_transaction: toTransaction,
        from_account: data.accounts[fromAccountIndex],
        to_account: data.accounts[toAccountIndex]
      };

    } catch (error) {
      console.error('❌ TransactionService.transfer error:', error);
      throw error;
    }
  }

  // Get transaction history for an account
  static getTransactionHistory(accountId) {
    try {
      const data = getData();

      // Verify account exists
      const account = data.accounts.find(a => a.id === parseInt(accountId));
      if (!account) {
        throw new Error('Account not found');
      }

      // Get transactions for this account
      const transactions = data.transactions
        .filter(t => t.account_id === parseInt(accountId))
        .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

      return {
        account: account,
        transactions: transactions,
        total: transactions.length
      };

    } catch (error) {
      console.error('❌ TransactionService.getTransactionHistory error:', error);
      throw error;
    }
  }

  // Get account balance
  static getAccountBalance(accountId) {
    try {
      const data = getData();

      const account = data.accounts.find(a => a.id === parseInt(accountId));
      if (!account) {
        throw new Error('Account not found');
      }

      return {
        account_number: account.account_number,
        balance: account.balance,
        currency: 'LKR',
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ TransactionService.getAccountBalance error:', error);
      throw error;
    }
  }
}

module.exports = TransactionService;