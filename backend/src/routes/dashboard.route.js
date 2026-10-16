const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const dashboardController = require("../controller/dashboard.controller");

const dashboardRouter = express.Router();

// All dashboard endpoints require authentication and are owner-scoped.

// Aggregate statistics for the authenticated user's dashboard.
dashboardRouter.get(
  "/stats",
  authMiddleware,
  dashboardController.getDashboardStats,
);

// Deterministic job recommendations from the user's primary resume.
// No AI calls — this endpoint does not consume AI quota.
dashboardRouter.get(
  "/recommendations",
  authMiddleware,
  dashboardController.getRecommendations,
);

module.exports = dashboardRouter;
