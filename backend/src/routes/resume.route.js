const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const { aiLimiter } = require("../middleware/rateLimit.middleware");
const aiQuota = require("../middleware/aiQuota.middleware");
const resumeController = require("../controller/resume.controller");
const bulletController = require("../controller/bullet.controller");
const { upload, verifyPdfContent } = require("../middleware/file.middleware");

const resumeRouter = express.Router();

resumeRouter.post(
  "/upload",
  authMiddleware,
  upload.single("resume"),
  verifyPdfContent,
  resumeController.uploadResumeController,
);

resumeRouter.post(
  "/",
  authMiddleware,
  resumeController.createResumeFromTextController,
);

resumeRouter.get("/", authMiddleware, resumeController.listResumesController);

resumeRouter.get(
  "/primary",
  authMiddleware,
  resumeController.getPrimaryResumeController,
);

resumeRouter.get("/:id", authMiddleware, resumeController.getResumeController);

resumeRouter.patch(
  "/:id/primary",
  authMiddleware,
  resumeController.setPrimaryResumeController,
);

resumeRouter.delete(
  "/:id",
  authMiddleware,
  resumeController.deleteResumeController,
);

resumeRouter.post(
  "/improve-bullet",
  authMiddleware,
  aiLimiter,
  aiQuota,
  bulletController.improveBulletController,
);

module.exports = resumeRouter;
