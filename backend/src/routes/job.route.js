const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const jobController = require("../controller/job.controller");

const jobRouter = express.Router();

// All job endpoints require authentication. Listings are a shared board:
// everyone sees open postings, owners manage their own.

jobRouter.post("/", authMiddleware, jobController.createJobController);
jobRouter.get("/", authMiddleware, jobController.listJobsController);
jobRouter.get("/:id", authMiddleware, jobController.getJobController);
jobRouter.patch("/:id", authMiddleware, jobController.updateJobController);
jobRouter.delete("/:id", authMiddleware, jobController.deleteJobController);

module.exports = jobRouter;
