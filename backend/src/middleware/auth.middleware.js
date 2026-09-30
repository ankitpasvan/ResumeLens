const jwt = require("jsonwebtoken");
const config = require("../utils/env");
const blacklistModel = require("../models/blacklist.model");

// Protects routes by verifying the JWT stored in the `token` cookie.
// Also rejects tokens that were revoked via logout (blacklist).
async function authMiddleware(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated. Please log in." });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    const blacklisted = await blacklistModel.findOne({ token });
    if (blacklisted) {
      return res
        .status(401)
        .json({ error: "Session expired. Please log in again." });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ error: "Invalid or expired token. Please log in again." });
  }
}

// Validates registration input before it reaches the controller.
function validateRegister(req, res, next) {
  const username = (req.body.username || req.body.name || "").trim();
  const email = (req.body.email || "").trim().toLowerCase();
  const password = req.body.password || "";

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "Username, email and password are required." });
  }

  if (username.length < 3 || username.length > 50) {
    return res
      .status(400)
      .json({ error: "Username must be between 3 and 50 characters." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res
      .status(400)
      .json({ error: "Please provide a valid email address." });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters long." });
  }

  req.body.username = username;
  req.body.email = email;
  next();
}

module.exports = { authMiddleware, validateRegister };
