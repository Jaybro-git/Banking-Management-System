// routes/customers.js
const express = require("express");
const router = express.Router();
const db = require("../db");  // use shared db

// Helper: age calculator
function getAgeFromDOB(dobYYYYMMDD) {
  const today = new Date();
  const dob  = new Date(dobYYYYMMDD);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// CREATE CUSTOMER
router.post("/", (req, res) => {
  const { customer_id, first_name, last_name, date_of_birth, gender, phone_number, email, address } = req.body;

  const sql = `
    INSERT INTO customer 
    (customer_id, first_name, last_name, date_of_birth, gender, phone_number, email, address, registration_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'ACTIVE')
  `;

  db.query(sql, [customer_id, first_name, last_name, date_of_birth, gender, phone_number, email, address], (err) => {
    if (err) {
      console.error("❌ /customers SQL:", err.sqlMessage || err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Customer added successfully ✅" });
  });
});

module.exports = router;
