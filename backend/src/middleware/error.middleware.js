const multer = require("multer");

// 404 for any route that didn't match. Must be registered AFTER all routes.
function notFoundHandler(req, res) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
}

// Global error handler. Must be the LAST middleware registered, with the
// (err, req, res, next) signature. Translates known error types into clean
// client responses; everything else becomes a generic 500 so we never leak
// stack traces or internals to the client.
function errorHandler(err, req, res, next) {
  // Multer upload errors (file too large, unexpected field, etc.)
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum allowed size is 3MB." });
    }
    return res.status(400).json({ error: "File upload failed." });
  }

  // Rejected by our fileFilter (wrong file type).
  if (err && err.message === "Only PDF files are allowed") {
    return res.status(400).json({ error: err.message });
  }

  // Mongoose schema validation failures.
  if (err && err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  // Malformed ObjectId in a query (e.g. /api/interview/resume/abc).
  if (err && err.name === "CastError") {
    return res.status(400).json({ error: "Invalid ID format." });
  }

  // Explicit HTTP errors thrown with a statusCode property.
  if (err && err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}

module.exports = { notFoundHandler, errorHandler };
