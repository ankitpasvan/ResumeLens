const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const interviewController = require("../controller/interview.controller");
const upload = require("../middleware/file.middleware");

const interviewRouter = express.Router();

interviewRouter.post(
  "/",
  authMiddleware,
  upload.single("resume"),
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
