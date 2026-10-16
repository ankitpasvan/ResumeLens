const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const { aiLimiter } = require("../middleware/rateLimit.middleware");
const aiQuota = require("../middleware/aiQuota.middleware");
const resumeController = require("../controller/resume.controller");
const bulletController = require("../controller/bullet.controller");
const { upload, verifyPdfContent } = require("../middleware/file.middleware");

const resumeRouter = express.Router();

// All resume endpoints require authentication and are owner-scoped.

// Upload a resume PDF (multipart field `resume`; 3MB limit).
resumeRouter.post(
  "/upload",
  authMiddleware,
  upload.single("resume"),
  verifyPdfContent,
  resumeController.uploadResumeController,
);

// Save a resume from pasted text. JSON body: { name, resumeText }.
resumeRouter.post(
  "/",
  authMiddleware,
  resumeController.createResumeFromTextController,
);

// List the user's resumes, newest first (parsed text excluded).
resumeRouter.get("/", authMiddleware, resumeController.listResumesController);

// Primary resume (falls back to the most recent one).
resumeRouter.get(
  "/primary",
  authMiddleware,
  resumeController.getPrimaryResumeController,
);

// Single resume with full parsed text.
resumeRouter.get("/:id", authMiddleware, resumeController.getResumeController);

// Mark a resume as the primary one.
resumeRouter.patch(
  "/:id/primary",
  authMiddleware,
  resumeController.setPrimaryResumeController,
);

// Delete a resume.
resumeRouter.delete(
  "/:id",
  authMiddleware,
  resumeController.deleteResumeController,
);

// Improve a single resume bullet with AI. JSON body: { bullet, jobDescription? }.
// AI endpoint: goes through the AI rate limiter and the per-user daily quota,
// same as the ATS/match/interview routes. Registered after the /:id routes;
// as a POST it cannot be shadowed by the GET/PATCH/DELETE /:id routes above.
resumeRouter.post(
  "/improve-bullet",
  authMiddleware,
  aiLimiter,
  aiQuota,
  bulletController.improveBulletController,
);

module.exports = resumeRouter;
