const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const pinoHttp = require("pino-http");
const mongoose = require("mongoose");

// Validates required environment variables and exits if any are missing.
const config = require("./utils/env");
const logger = require("./utils/logger");
const connectDB = require("./config/database");
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/error.middleware");
const { generalLimiter } = require("./middleware/rateLimit.middleware");

const app = express();

// Behind Render/Railway/Heroku the app sits behind a proxy — trust the
// first hop so req.ip (used by the rate limiters) is the real client IP.
// Do NOT raise this number without understanding the proxy chain.
app.set("trust proxy", 1);

// Security headers (hides X-Powered-By, sets HSTS in production, etc.).
app.use(helmet());

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
// Express 5 leaves req.body undefined when no parseable body was sent.
// Normalize to {} so controllers can safely read/destructure it instead
// of throwing a TypeError (which would surface as a 500).
app.use((req, _res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

// Structured request logging (adds req.id; skips the health probe to
// keep logs clean).
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === "/api/health",
    },
  }),
);

// General rate-limit safety net for every route (stricter limiters are
// applied per-route below).
app.use(generalLimiter);

// Readiness-aware health check: reports 503 while MongoDB is unreachable
// so orchestrators stop routing traffic during a DB outage.
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  if (dbState !== 1) {
    return res.status(503).json({ status: "degraded", db: "unreachable" });
  }
  res.status(200).json({ status: "ok", db: "connected" });
});

app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/interview", require("./routes/interview.route"));
app.use("/api/ats", require("./routes/ats.route"));
app.use("/api/resumes", require("./routes/resume.route"));
app.use("/api/matches", require("./routes/match.route"));
app.use("/api/jobs", require("./routes/job.route"));
app.use("/api/saved-jobs", require("./routes/savedJob.route"));
app.use("/api/applications", require("./routes/application.route"));
app.use("/api/dashboard", require("./routes/dashboard.route"));

// Interactive API documentation (Swagger UI). Mounted before the 404
// handler so /api/docs is reachable.
try {
  const { swaggerUi, swaggerSpec } = require("./docs/swagger");
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} catch (err) {
  logger.warn({ err: err.message }, "API docs unavailable");
}

// 404 handler for unknown routes, then the global error handler (must be last).
app.use(notFoundHandler);
app.use(errorHandler);

connectDB();

module.exports = app;
