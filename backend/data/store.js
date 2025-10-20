const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data.json');

// Default data structure
const defaultData = {
  customers: [
    {
      id: 1,
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test@email.com',
      nic_number: '123456789V',
      date_of_birth: '1990-01-01',
      phone: '+94771234567',
      address: '123 Main St',
      occupation: 'Engineer',
      monthly_income: 50000,
      created_at: new Date().toISOString()
    }
  ],
  accounts: [],
  transactions: [],
  nextCustomerId: 2,
  nextAccountId: 1,
  nextTransactionId: 1
};

// Load data from file or use default
function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return JSON.parse(JSON.stringify(defaultData)); // Deep copy
}

// Save data to file
function saveData(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Get all data
function getData() {
  return loadData();
}

// Update data
function updateData(updates) {
  const data = loadData();
  Object.assign(data, updates);
  saveData(data);
  return data;
}

// ✅ MAKE SURE THESE EXPORTS EXIST
module.exports = { 
  getData, 
  updateData, 
  loadData, 
  saveData 
};