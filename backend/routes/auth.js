const express = require('express');
const pool = require('../db/index');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;
const SALT_ROUNDS = 10;

// 🔹 Middleware to authenticate JWT from cookie
function authenticateToken(req, res, next) {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ error: 'Access token not provided' });
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user; // attach decoded token to request
    next();
  });
}

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const userRes = await pool.query('SELECT * FROM user_account WHERE username = $1', [username]);
    
    if (!userRes.rows.length) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { username, employee_id: user.employee_id }, 
      ACCESS_TOKEN_SECRET, 
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { username, employee_id: user.employee_id }, 
      REFRESH_TOKEN_SECRET, 
      { expiresIn: '7d' }
    );

    // Save refresh token in database
    await pool.query(
      'UPDATE user_account SET refresh_token = $1 WHERE username = $2', 
      [refreshToken, username]
    );

    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    };

    res
      .cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
      })
      .cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({ 
        message: 'Logged in successfully',
        user: {
          username: user.username,
          employee_id: user.employee_id
        }
      });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token not provided' });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    
    const userRes = await pool.query(
      'SELECT * FROM user_account WHERE username = $1 AND refresh_token = $2', 
      [payload.username, refreshToken]
    );

    if (!userRes.rows.length) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const accessToken = jwt.sign(
      { username: payload.username, employee_id: payload.employee_id }, 
      ACCESS_TOKEN_SECRET, 
      { expiresIn: '15m' }
    );

    res
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      })
      .json({ message: 'Access token refreshed successfully' });

  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
});

// Verify token
router.get('/verify', (req, res) => {
  const token = req.cookies.accessToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Access token not provided' });
  }

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    res.status(200).json({ 
      message: 'Token is valid',
      user: {
        username: payload.username,
        employee_id: payload.employee_id
      }
    });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

// 🔹 New: Get logged-in user info
router.get('/me', authenticateToken, (req, res) => {
  const { username, employee_id } = req.user;
  res.json({ username, employee_id });
});

// Logout
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      await pool.query(
        'UPDATE user_account SET refresh_token = NULL WHERE username = $1', 
        [payload.username]
      );
    } catch (err) {
      console.error('Error clearing refresh token from database:', err);
    }
  }

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  };

  res
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json({ message: 'Logged out successfully' });
});

module.exports = router;
