const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ IMPORT AND USE YOUR ROUTE FILES PROPERLY
const customerRoutes = require('./routes/customers');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');

// ✅ USE THE ROUTES (this connects your route files)
app.use('/api/customers', customerRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: '🏦 Banking Backend Server is running!',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Banking backend running on http://localhost:${PORT}`);
  console.log('✅ Routes are now properly connected from route files');
  console.log('📋 Available routes:');
  console.log('   POST /api/customers/register');
  console.log('   GET  /api/customers');
  console.log('   GET  /api/customers/:id');
  console.log('   POST /api/accounts/eligible-types');
  console.log('   POST /api/accounts/open');
});
