// routes/admin-check.js
const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(200).json({ success: false, error: 'Password required' });

  if (password === process.env.ADMIN_REG_PASSWORD) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(200).json({ success: false, error: 'Incorrect admin password' });
  }
});

module.exports = router;
