const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require("./routes/auth");
const customerRoutes = require("./routes/customers");
const accountRoutes = require("./routes/accounts");
const transactionRoutes = require("./routes/transactions");
const dashboardRoutes = require("./routes/dashboard");
const fixedDepositRoutes = require("./routes/fixeddeposit"); // 👈 NEW

// Mount routes with base paths
app.use("/auth", authRoutes);             // e.g., /auth/login
app.use("/customers", customerRoutes);    // e.g., /customers/register
app.use("/accounts", accountRoutes);      // e.g., /accounts
app.use("/transactions", transactionRoutes); // e.g., /transactions/deposit
app.use("/dashboard", dashboardRoutes);   // e.g., /dashboard/summary
app.use("/fixed-deposits", fixedDepositRoutes); // 👈 NEW

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
