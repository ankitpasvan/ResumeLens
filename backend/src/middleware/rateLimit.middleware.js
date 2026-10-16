// Rate limiting: brute-force protection for auth, cost protection for the
// Gemini-backed AI endpoints, and a general safety net for everything else.
//
// All limiters are per-IP, per 15-minute window. Limits are configurable
// via RATE_LIMIT_* env vars (see src/utils/env.js). Responses use the
// standard RateLimit-* headers (draft-7) plus a JSON error body.
//
// NOTE: behind a proxy (Render/Railway), app.set("trust proxy", 1) in
// app.js keeps req.ip accurate. Without it, X-Forwarded-For spoofing could
// bypass these limits.
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

// Login/register: strict — credential-stuffing and fake-account protection.
const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: config.rateLimitAuthMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: jsonHandler(
    "Too many authentication attempts. Please try again later.",
  ),
});

// AI endpoints (ATS analyze, match, interview generation): moderate —
// every hit costs at least one Gemini call, so this caps quota burn.
const aiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: config.rateLimitAiMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: jsonHandler(
    "Too many AI requests. Please slow down and try again later.",
  ),
});

// Everything else: generous safety net against accidental floods.
const generalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: config.rateLimitGeneralMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: jsonHandler("Too many requests. Please try again later."),
});

module.exports = { authLimiter, aiLimiter, generalLimiter };
