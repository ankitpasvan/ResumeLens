const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const matchController = require("../controller/match.controller");

const matchRouter = express.Router();

// All match endpoints require authentication and are owner-scoped.

// Match a stored resume against a job posting.
// Body: { resumeId?, jobTitle, jobDescription }.
// Without resumeId, the user's primary resume is used.
matchRouter.post("/", authMiddleware, matchController.createMatchController);

// History of the user's past matches, newest first.
matchRouter.get("/", authMiddleware, matchController.listMatchesController);

// Single match, owner-scoped.
matchRouter.get("/:id", authMiddleware, matchController.getMatchController);

module.exports = matchRouter;
