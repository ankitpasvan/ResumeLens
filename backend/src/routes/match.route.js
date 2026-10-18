const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const { aiLimiter } = require("../middleware/rateLimit.middleware");
const aiQuota = require("../middleware/aiQuota.middleware");
const matchController = require("../controller/match.controller");

const matchRouter = express.Router();

matchRouter.post(
  "/",
  authMiddleware,
  aiLimiter,
  aiQuota,
  matchController.createMatchController,
);

matchRouter.get("/", authMiddleware, matchController.listMatchesController);

matchRouter.get("/:id", authMiddleware, matchController.getMatchController);

module.exports = matchRouter;
