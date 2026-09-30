const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const jobController = require("../controller/job.controller");

const applicationRouter = express.Router();

// Application tracking pipeline — always owner-scoped.

applicationRouter.post(
  "/",
  authMiddleware,
  jobController.createApplicationController,
);
applicationRouter.get(
  "/",
  authMiddleware,
  jobController.listApplicationsController,
);
applicationRouter.patch(
  "/:id",
  authMiddleware,
  jobController.updateApplicationStatusController,
);
applicationRouter.put(
  "/:id",
  authMiddleware,
  jobController.updateApplicationController,
);
applicationRouter.delete(
  "/:id",
  authMiddleware,
  jobController.deleteApplicationController,
);

module.exports = applicationRouter;
