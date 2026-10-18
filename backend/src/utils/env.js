const dotenv = require("dotenv");

dotenv.config();

const required = ["MONGO_URI", "JWT_SECRET", "GEMINI_API_KEY"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `Missing required environment variable(s): ${missing.join(", ")}.\n` +
      "Copy backend/.env.example to backend/.env and fill in the values.",
  );
  process.exit(1);
}

function clampInt(raw, fallback, min, max) {
  const value = Number(raw);

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  geminiApiKey: process.env.GEMINI_API_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID,

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  cookieSecure: process.env.NODE_ENV === "production",
  isProduction: process.env.NODE_ENV === "production",

  geminiModel: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  aiTimeoutMs: clampInt(process.env.AI_TIMEOUT_MS, 25000, 5000, 120000),
  aiMaxRetries: clampInt(process.env.AI_MAX_RETRIES, 1, 0, 2),
  aiDailyLimit: clampInt(process.env.AI_DAILY_LIMIT, 30, 1, 10000),

  rateLimitAuthMax: clampInt(process.env.RATE_LIMIT_AUTH_MAX, 10, 1, 1000),
  rateLimitAiMax: clampInt(process.env.RATE_LIMIT_AI_MAX, 30, 1, 10000),
  rateLimitGeneralMax: clampInt(
    process.env.RATE_LIMIT_GENERAL_MAX,
    300,
    1,
    100000,
  ),
};
