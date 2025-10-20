const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');

const app = express();
app.use(cors({ 
  origin: ['http://localhost:3000', 'https://btrust-frontend-production.up.railway.app'], 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// Routes
const adminCheckRoutes = require('./routes/admin-check');
const branchRoutes = require('./routes/branch');
const employeeRoutes = require('./routes/employee');
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const { router: transactionsRouter } = require('./routes/transactions');
const customerLookupRoutes = require('./routes/customerLookup');
const fixedDepositRoutes = require('./routes/fixed-deposit');
const profileRouter = require('./routes/profile');
const { payMonthlyInterest } = require('./routes/interestScheduler');
const reportsRouter = require('./routes/reports');

app.use('/api/admin-check', adminCheckRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionsRouter);
app.use('/api/customer-lookup', customerLookupRoutes);
app.use('/api/fixed-deposit', fixedDepositRoutes);
app.use('/api/profile', profileRouter);
app.use('/api/reports', reportsRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));