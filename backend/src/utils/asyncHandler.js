// Wraps an async route handler/controller so rejected promises are
// forwarded to the global error middleware instead of hanging the request
// or crashing the process.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
