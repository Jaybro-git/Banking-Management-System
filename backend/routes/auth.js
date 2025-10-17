// routes/auth.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

// REGISTER employee
router.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "username and password required" });
    }

    const roleSafe = role && ["admin","officer","agent"].includes(role) ? role : "officer";

    const [exists] = await db.promise().query(
      "SELECT employee_id FROM employee WHERE username = ?",
      [username]
    );
    if (exists.length) return res.status(409).json({ error: "Username already taken" });

    const hash = await bcrypt.hash(password, ROUNDS);
    const [result] = await db.promise().query(
      "INSERT INTO employee (username, password_hash, role) VALUES (?, ?, ?)",
      [username, hash, roleSafe]
    );

    res.status(201).json({ message: "Employee registered", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.promise().query(
      "SELECT * FROM employee WHERE username = ?",
      [username]
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      { sub: user.employee_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
