const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const { aiLimiter } = require("../middleware/rateLimit.middleware");
const aiQuota = require("../middleware/aiQuota.middleware");
const atsController = require("../controller/ats.controller");
const { upload, verifyPdfContent } = require("../middleware/file.middleware");

const atsRouter = express.Router();

atsRouter.post(
  "/analyze",
  authMiddleware,
  aiLimiter,
  aiQuota,
  upload.single("resume"),
  verifyPdfContent,
  atsController.analyzeAtsController,
);

atsRouter.get("/", authMiddleware, atsController.listAtsController);

atsRouter.get("/:id", authMiddleware, atsController.getAtsController);

module.exports = atsRouter;
