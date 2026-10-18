const rateLimit = require("express-rate-limit");
const config = require("../utils/env");

const WINDOW_MS = 15 * 60 * 1000;

function jsonHandler(message) {
  return (req, res) => {
    res.status(429).json({
      error: message,
      retryAfterSeconds: Math.ceil(WINDOW_MS / 1000),
    });
  };
}

const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: config.rateLimitAuthMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: jsonHandler(
    "Too many authentication attempts. Please try again later.",
  ),
});

const aiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: config.rateLimitAiMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: jsonHandler(
    "Too many AI requests. Please slow down and try again later.",
  ),
});

const generalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: config.rateLimitGeneralMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: jsonHandler("Too many requests. Please try again later."),
});

module.exports = { authLimiter, aiLimiter, generalLimiter };
