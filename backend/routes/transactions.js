const express = require("express");
const router = express.Router();
const db = require("../db");

// Helper: generate reference number
function generateRef() {
  return "TXN" + Date.now();
}

// DEPOSIT
router.post("/deposit", (req, res) => {
  const { account_id, amount } = req.body;

  if (amount <= 0) {
    return res.status(400).json({ error: "Deposit amount must be positive" });
  }

  // Fetch current balance
  db.query("SELECT current_balance FROM account WHERE account_id = ?", [account_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Account not found" });

    const balanceBefore = results[0].current_balance;
    const balanceAfter = Number(balanceBefore) + Number(amount);
    const reference = generateRef();

    // Start transaction
    db.beginTransaction((err) => {
      if (err) return res.status(500).json({ error: "Transaction error" });

      // Update balance
      db.query("UPDATE account SET current_balance = ? WHERE account_id = ?", [balanceAfter, account_id], (err) => {
        if (err) return db.rollback(() => res.status(500).json({ error: "Failed to update balance" }));

        // Insert transaction log
        const sql = `
          INSERT INTO transaction (account_id, transaction_type, amount, balance_before, balance_after, reference_number, status)
          VALUES (?, 'DEPOSIT', ?, ?, ?, ?, 'SUCCESS')
        `;
        db.query(sql, [account_id, amount, balanceBefore, balanceAfter, reference], (err) => {
          if (err) return db.rollback(() => res.status(500).json({ error: "Failed to log transaction" }));

          db.commit((err) => {
            if (err) return db.rollback(() => res.status(500).json({ error: "Commit failed" }));
            res.json({ message: "Deposit successful ✅", balance: balanceAfter, reference });
          });
        });
      });
    });
  });
});


// WITHDRAW
router.post("/withdraw", (req, res) => {
  const { account_id, amount } = req.body;

  if (amount <= 0) {
    return res.status(400).json({ error: "Withdrawal amount must be positive" });
  }

  db.query("SELECT a.current_balance, at.minimum_balance FROM account a JOIN account_type at ON a.account_type_id = at.account_type_id WHERE a.account_id = ?", [account_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Account not found" });

    const balanceBefore = results[0].current_balance;
    const minBalance = results[0].minimum_balance;
    const balanceAfter = Number(balanceBefore) - Number(amount);

    // Check minimum balance rule
    if (balanceAfter < minBalance) {
      return res.status(400).json({ error: `Withdrawal denied ❌. Must keep minimum balance of ${minBalance}` });
    }

    const reference = generateRef();

    db.beginTransaction((err) => {
      if (err) return res.status(500).json({ error: "Transaction error" });

      db.query("UPDATE account SET current_balance = ? WHERE account_id = ?", [balanceAfter, account_id], (err) => {
        if (err) return db.rollback(() => res.status(500).json({ error: "Failed to update balance" }));

        const sql = `
          INSERT INTO transaction (account_id, transaction_type, amount, balance_before, balance_after, reference_number, status)
          VALUES (?, 'WITHDRAW', ?, ?, ?, ?, 'SUCCESS')
        `;
        db.query(sql, [account_id, amount, balanceBefore, balanceAfter, reference], (err) => {
          if (err) return db.rollback(() => res.status(500).json({ error: "Failed to log transaction" }));

          db.commit((err) => {
            if (err) return db.rollback(() => res.status(500).json({ error: "Commit failed" }));
            res.json({ message: "Withdrawal successful ✅", balance: balanceAfter, reference });
          });
        });
      });
    });
  });
});

// GET transaction history for an account
router.get("/:account_id", (req, res) => {
  const { account_id } = req.params;

  const sql = `
    SELECT 
      t.transaction_id AS id,
      t.reference_number AS reference,
      t.transaction_type AS type,
      t.amount,
      t.balance_after AS balance,
      t.status,
      t.time_date_stamp,
      a.account_id
    FROM transaction t
    JOIN account a ON t.account_id = a.account_id
    JOIN account_holder ah ON a.account_id = ah.account_id
    JOIN customer c ON ah.customer_id = c.customer_id
    WHERE t.account_id = ?
  `;

  db.query(sql, [account_id], (err, results) => {
  if (err) {
    console.error("❌ SQL Error:", err.sqlMessage || err); // 👈 print the real error
    return res.status(500).json({ error: "Database error" });
  }
  res.json(results);
});

});



module.exports = router;
