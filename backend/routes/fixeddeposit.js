const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE Fixed Deposit
router.post("/", (req, res) => {
  const { account_id, amount, interest_rate, maturity_date } = req.body;

  if (!account_id || !amount || !interest_rate || !maturity_date) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const query = `
    INSERT INTO fixed_deposits (account_id, amount, interest_rate, maturity_date, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;

  db.query(query, [account_id, amount, interest_rate, maturity_date], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error (fixed_deposits)" });
    res.json({ success: true, fixed_deposit_id: result.insertId });
  });
});

// GET All Fixed Deposits
router.get("/", (req, res) => {
  db.query("SELECT * FROM fixed_deposits", (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ success: true, data: rows });
  });
});

// GET Fixed Deposit by ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM fixed_deposits WHERE fixed_deposit_id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (rows.length === 0) return res.status(404).json({ error: "Fixed Deposit not found" });
    res.json({ success: true, data: rows[0] });
  });
});

// (Optional) CLOSE Fixed Deposit
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM fixed_deposits WHERE fixed_deposit_id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Fixed Deposit not found" });
    res.json({ success: true, message: "Fixed Deposit closed successfully" });
  });
});

module.exports = router;
