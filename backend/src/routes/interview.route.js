const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const { aiLimiter } = require("../middleware/rateLimit.middleware");
const aiQuota = require("../middleware/aiQuota.middleware");
const interviewController = require("../controller/interview.controller");
const { upload, verifyPdfContent } = require("../middleware/file.middleware");

const interviewRouter = express.Router();

interviewRouter.post(
  "/",
  authMiddleware,
  aiLimiter,
  aiQuota,
  upload.single("resume"),
  verifyPdfContent,
  interviewController.generateInterViewReportController,
);

interviewRouter.get(
  "/report/:interviewReportId",
  authMiddleware,
  interviewController.getInterViewReportByIdController,
);

interviewRouter.get(
  "/",
  authMiddleware,
  interviewController.getInterViewReportController,
);

interviewRouter.get(
  "/resume/:interviewReportId",
  authMiddleware,
  interviewController.getResumePdfController,
);

module.exports = interviewRouter;
