const express = require("express");
const router = express.Router();
const db = require("../db");

// Dashboard summary API
router.get("/summary", (req, res) => {
  const summary = {};

  // Query total customers
  db.query("SELECT COUNT(*) AS total_customers FROM customer", (err, custRes) => {
    if (err) return res.status(500).json({ error: "Database error (customers)" });
    summary.total_customers = custRes[0].total_customers;

    // Query total accounts
    db.query("SELECT COUNT(*) AS total_accounts FROM account", (err, accRes) => {
      if (err) return res.status(500).json({ error: "Database error (accounts)" });
      summary.total_accounts = accRes[0].total_accounts;

      // Query total balance
      db.query("SELECT SUM(current_balance) AS total_balance FROM account", (err, balRes) => {
        if (err) return res.status(500).json({ error: "Database error (balance)" });
        summary.total_balance = balRes[0].total_balance || 0;

        // Query total transactions
        db.query("SELECT COUNT(*) AS total_transactions FROM transaction", (err, txnRes) => {
          if (err) return res.status(500).json({ error: "Database error (transactions)" });
          summary.total_transactions = txnRes[0].total_transactions;

          // Get recent 5 transactions
          db.query(
            "SELECT transaction_id, transaction_type, amount, status, reference_number, time_date_stamp FROM transaction ORDER BY time_date_stamp DESC LIMIT 5",
            (err, recentRes) => {
              if (err) return res.status(500).json({ error: "Database error (recent)" });
              summary.recent_transactions = recentRes;
              res.json(summary);
            }
          );
        });
      });
    });
  });
});

module.exports = router;
