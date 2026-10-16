// Central structured logger (pino). JSON logs in production; level
// configurable via LOG_LEVEL. Import this instead of console.* so logs
// are machine-readable and never leak into unstructured stdout.
const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});

module.exports = logger;
