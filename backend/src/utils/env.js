// Central environment configuration. Validates required variables at
// startup so the app fails fast with a clear message instead of crashing
// later (or worse, running with a missing JWT secret).
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

module.exports = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  geminiApiKey: process.env.GEMINI_API_KEY,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  // Secure cookies only over HTTPS. In production NODE_ENV must be
  // "production" for this to take effect.
  cookieSecure: process.env.NODE_ENV === "production",
  isProduction: process.env.NODE_ENV === "production",
};
