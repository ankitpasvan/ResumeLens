const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const resumeController = require("../controller/resume.controller");
const upload = require("../middleware/file.middleware");

const resumeRouter = express.Router();

// All resume endpoints require authentication and are owner-scoped.

// Upload a resume PDF (multipart field `resume`; 3MB limit).
resumeRouter.post(
  "/upload",
  authMiddleware,
  upload.single("resume"),
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

module.exports = resumeRouter;
