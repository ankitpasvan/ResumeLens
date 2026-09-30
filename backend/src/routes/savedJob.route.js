const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const jobController = require("../controller/job.controller");

const savedJobRouter = express.Router();

// The user's saved jobs — always owner-scoped.

savedJobRouter.post(
  "/",
  authMiddleware,
  jobController.createSavedJobController,
);
savedJobRouter.get("/", authMiddleware, jobController.listSavedJobsController);
savedJobRouter.delete(
  "/:id",
  authMiddleware,
  jobController.deleteSavedJobController,
);

module.exports = savedJobRouter;
