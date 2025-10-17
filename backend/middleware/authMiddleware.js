// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]; // look for "Authorization" header
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer token"

  if (!token) return res.status(401).json({ error: "Access denied. No token provided ❌" });

  jwt.verify(token, "secretKey", (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token ❌" });

    req.user = user; // attach user info to request
    next(); // go to the route
  });
}

module.exports = authenticateToken;
