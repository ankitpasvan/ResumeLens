const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const pinoHttp = require("pino-http");
const mongoose = require("mongoose");

const config = require("./utils/env");
const logger = require("./utils/logger");
const connectDB = require("./config/database");
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/error.middleware");
const { generalLimiter } = require("./middleware/rateLimit.middleware");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use((req, _res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === "/api/health",
    },
  }),
);

app.use(generalLimiter);

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

try {
  const { swaggerUi, swaggerSpec } = require("./docs/swagger");
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} catch (err) {
  logger.warn({ err: err.message }, "API docs unavailable");
}

app.use(notFoundHandler);
app.use(errorHandler);

connectDB();

module.exports = app;
