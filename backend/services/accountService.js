const { getData, updateData } = require('../data/store');
const { calculateAge } = require('../utils/ageCalculator');
const { getEligibleAccountType } = require('../utils/accountEligibility');

class AccountService {
  // Check account eligibility
  static checkEligibility(dateOfBirth) {
    const age = calculateAge(dateOfBirth);
    const eligibleAccount = getEligibleAccountType(age);
    
    return {
      age,
      eligibleAccount
    };
  }

  // Open new account
  static openAccount(accountData) {
    try {
      console.log('🔧 AccountService.openAccount called with:', accountData);
      
      const { customer_id, date_of_birth, account_type_id, initial_deposit = 0 } = accountData;
      const data = getData();

      console.log('📊 Current data:', data);

      // Check customer exists
      const customer = data.customers.find(c => c.id === parseInt(customer_id));
      console.log('👤 Found customer:', customer);
      
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Check eligibility
      const { age, eligibleAccount } = this.checkEligibility(date_of_birth);
      console.log('🎯 Eligibility check - age:', age, 'eligible:', eligibleAccount);
      
      if (parseInt(account_type_id) !== eligibleAccount.id) {
        throw new Error(`Selected account type not eligible. Based on age ${age}, you qualify for: ${eligibleAccount.name} account`);
      }

      if (parseFloat(initial_deposit) < eligibleAccount.min_balance) {
        throw new Error(`Minimum initial deposit for ${eligibleAccount.name} account is LKR ${eligibleAccount.min_balance}`);
      }

      // Create account
      const accountNumber = 'ACC' + Date.now();
      const newAccount = {
        id: data.nextAccountId++,
        account_number: accountNumber,
        customer_id: parseInt(customer_id),
        account_type: eligibleAccount.name,
        account_type_id: parseInt(account_type_id),
        balance: parseFloat(initial_deposit),
        interest_rate: eligibleAccount.interest_rate,
        minimum_balance: eligibleAccount.min_balance,
        status: 'active',
        opened_date: new Date().toISOString()
      };

      console.log('💳 New account created:', newAccount);

      // Save to store
      data.accounts.push(newAccount);
      updateData(data);

      return {
        account: newAccount,
        customer_age: age
      };
    } catch (error) {
      console.error('❌ AccountService.openAccount error:', error);
      throw error;
    }
  }

  // Get all accounts
  static getAllAccounts() {
    const data = getData();
    
    const accountsWithCustomer = data.accounts.map(account => {
      const customer = data.customers.find(c => c.id === account.customer_id);
      return {
        ...account,
        customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown'
      };
    });

    return accountsWithCustomer;
  }

  // Get account by ID
  static getAccountById(accountId) {
    const data = getData();
    
    const account = data.accounts.find(a => a.id === parseInt(accountId));
    if (!account) {
      throw new Error('Account not found');
    }

    const customer = data.customers.find(c => c.id === account.customer_id);
    return {
      ...account,
      customer: customer || null
    };
  }

  // Get accounts by customer
  static getAccountsByCustomer(customerId) {
    const data = getData();
    
    const customerAccounts = data.accounts.filter(a => a.customer_id === parseInt(customerId));
    const customer = data.customers.find(c => c.id === parseInt(customerId));
    
    if (!customer) {
      throw new Error('Customer not found');
    }

    return {
      customer: {
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`
      },
      accounts: customerAccounts
    };
  }

  // Close account
  static closeAccount(accountId) {
    const data = getData();
    
    const accountIndex = data.accounts.findIndex(a => a.id === parseInt(accountId));
    if (accountIndex === -1) {
      throw new Error('Account not found');
    }

    // Update account
    data.accounts[accountIndex].status = 'closed';
    data.accounts[accountIndex].closed_date = new Date().toISOString();
    updateData(data);

    return data.accounts[accountIndex];
  }
}

module.exports = AccountService;