const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

// Validates required environment variables and exits if any are missing.
const config = require("./utils/env");
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

// General rate-limit safety net for every route (stricter limiters are
// applied per-route below).
app.use(generalLimiter);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/interview", require("./routes/interview.route"));
app.use("/api/ats", require("./routes/ats.route"));
app.use("/api/resumes", require("./routes/resume.route"));
app.use("/api/matches", require("./routes/match.route"));
app.use("/api/jobs", require("./routes/job.route"));
app.use("/api/saved-jobs", require("./routes/savedJob.route"));
app.use("/api/applications", require("./routes/application.route"));

// 404 handler for unknown routes, then the global error handler (must be last).
app.use(notFoundHandler);
app.use(errorHandler);

connectDB();

module.exports = app;
