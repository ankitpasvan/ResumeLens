const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        error: "Please login first",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

function validateUser(req, res, next) {
  const username = req.body.username || req.body.name;
  const { email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      error: "Username, email and password are required",
    });
  }

  if (!req.body.username && req.body.name) {
    req.body.username = req.body.name;
  }

  next();
}

module.exports = { authMiddleware, validateUser };
