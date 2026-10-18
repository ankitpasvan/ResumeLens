const multer = require("multer");
const logger = require("../utils/logger");

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
}

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum allowed size is 3MB." });
    }
    return res.status(400).json({ error: "File upload failed." });
  }

  if (err && err.message === "Only PDF files are allowed") {
    return res.status(400).json({ error: err.message });
  }

  if (err && err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  if (err && err.name === "CastError") {
    return res.status(400).json({ error: "Invalid ID format." });
  }

  if (err && err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Something went wrong. Please try again." });
}

module.exports = { notFoundHandler, errorHandler };
