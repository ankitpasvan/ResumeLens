const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Validates required environment variables and exits if any are missing.
const config = require("./utils/env");
const connectDB = require("./config/database");
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/error.middleware");

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/interview", require("./routes/interview.route"));
app.use("/api/ats", require("./routes/ats.route"));
app.use("/api/resumes", require("./routes/resume.route"));
app.use("/api/matches", require("./routes/match.route"));

// 404 handler for unknown routes, then the global error handler (must be last).
app.use(notFoundHandler);
app.use(errorHandler);

connectDB();

module.exports = app;
