// Get eligible account type based on age
const getEligibleAccountType = (age) => {
  if (age < 13) return { id: 1, name: 'Children', interest_rate: 12.00, min_balance: 0.00 };
  if (age < 18) return { id: 2, name: 'Teen', interest_rate: 11.00, min_balance: 500.00 };
  if (age < 60) return { id: 3, name: 'Adult', interest_rate: 10.00, min_balance: 1000.00 };
  return { id: 4, name: 'Senior', interest_rate: 13.00, min_balance: 1000.00 };
};

module.exports = { getEligibleAccountType };