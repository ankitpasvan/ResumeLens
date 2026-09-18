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
  "/report/:interviewId",
  authMiddleware,
  interviewController.getInterviewReportByIdController,
);

interviewRouter.get(
  "/",
  authMiddleware,
  interviewController.getAllInterviewReportsController,
);

interviewRouter.get(
  "/resume/:interviewReportId",
  authMiddleware,
  interviewController.generateResumePdfController,
);

interviewRouter.interviewRouter = interviewRouter;
module.exports = interviewRouter;
