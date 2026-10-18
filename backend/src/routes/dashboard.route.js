const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const dashboardController = require("../controller/dashboard.controller");

const dashboardRouter = express.Router();

dashboardRouter.get(
  "/stats",
  authMiddleware,
  dashboardController.getDashboardStats,
);

dashboardRouter.get(
  "/recommendations",
  authMiddleware,
  dashboardController.getRecommendations,
);

module.exports = dashboardRouter;
