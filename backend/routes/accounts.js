// routes/accounts.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const { getAgeFromDOB } = require("./utils"); // optional helper if you extract it

// OPEN ACCOUNT
router.post("/", (req, res) => {
  const { account_id, account_type_id, holder_ids, initial_deposit } = req.body;

  if (!Array.isArray(holder_ids) || holder_ids.length === 0) {
    return res.status(400).json({ error: "holder_ids must be a non-empty array" });
  }

  // Fetch account type rules
  db.query("SELECT * FROM account_type WHERE account_type_id = ?", [account_type_id], (err, atRows) => {
    if (err) return res.status(500).json({ error: "Database error (account_type)" });
    if (atRows.length === 0) return res.status(400).json({ error: "Invalid account_type_id" });

    const at = atRows[0];

    if (Number(initial_deposit) < Number(at.minimum_balance)) {
      return res.status(400).json({ error: `Minimum balance required: ${at.minimum_balance}` });
    }

    // Validate customers & ages
    const placeholders = holder_ids.map(() => "?").join(",");
    db.query(`SELECT customer_id, date_of_birth FROM customer WHERE customer_id IN (${placeholders})`, holder_ids, (err, custRows) => {
      if (err) return res.status(500).json({ error: "Database error (customers)" });
      if (custRows.length !== holder_ids.length) {
        return res.status(400).json({ error: "One or more holder_ids do not exist" });
      }

      const allAgesOk = custRows.every((c) => {
        const age = getAgeFromDOB(c.date_of_birth);
        return age >= at.min_age && age <= at.max_age;
      });

      if (!allAgesOk) {
        return res.status(400).json({ error: `Age eligibility failed (allowed ${at.min_age}-${at.max_age})` });
      }

      if (at.account_type_name === "Joint" && holder_ids.length < 2) {
        return res.status(400).json({ error: "Joint account requires at least 2 holders" });
      }

      // Transaction: account + holders
      db.beginTransaction((err) => {
        if (err) return res.status(500).json({ error: "Could not start transaction" });

        db.query(
          "INSERT INTO account (account_id, account_type_id, current_balance, status) VALUES (?, ?, ?, 'ACTIVE')",
          [account_id, account_type_id, initial_deposit],
          (err) => {
            if (err) return db.rollback(() => res.status(500).json({ error: "Failed to create account" }));

            const values = holder_ids.map((cid) => [cid, account_id]);
            db.query("INSERT INTO account_holder (customer_id, account_id) VALUES ?", [values], (err) => {
              if (err) return db.rollback(() => res.status(500).json({ error: "Failed to link holders" }));

              db.commit((err) => {
                if (err) return db.rollback(() => res.status(500).json({ error: "Failed to commit" }));
                res.json({ message: "Account opened successfully ✅" });
              });
            });
          }
        );
      });
    });
  });
});


// GET account by ID
router.get("/:account_id", (req, res) => {
  const { account_id } = req.params;

  const sql = `
    SELECT a.account_id, a.current_balance, at.account_type_name, 
           c.customer_name, c.dob
    FROM account a
    JOIN account_type at ON a.account_type_id = at.account_type_id
    JOIN account_holder ah ON a.account_id = ah.account_id
    JOIN customer c ON ah.customer_id = c.customer_id
    WHERE a.account_id = ?
    LIMIT 1
  `;

  db.query(sql, [account_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Account not found" });

    const acc = results[0];
    res.json({
      accountId: acc.account_id,
      customerName: acc.customer_name,
      accountType: acc.account_type_name,
      current_balance: acc.current_balance,
      dob: acc.dob
    });
  });
});


module.exports = router;
