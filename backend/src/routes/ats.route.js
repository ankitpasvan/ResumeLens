const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const { aiLimiter } = require("../middleware/rateLimit.middleware");
const aiQuota = require("../middleware/aiQuota.middleware");
const atsController = require("../controller/ats.controller");
const { upload, verifyPdfContent } = require("../middleware/file.middleware");

const atsRouter = express.Router();

// Analyze a resume (PDF upload or resumeText) against an optional job
// description. Returns the ATS score with a full explainable breakdown.
atsRouter.post(
  "/analyze",
  authMiddleware,
  aiLimiter,
  aiQuota,
  upload.single("resume"),
  verifyPdfContent,
  atsController.analyzeAtsController,
);

// History of the user's past analyses, newest first.
atsRouter.get("/", authMiddleware, atsController.listAtsController);

// Single analysis, owner-scoped.
atsRouter.get("/:id", authMiddleware, atsController.getAtsController);

module.exports = atsRouter;
