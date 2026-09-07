const { Router } = require("express");
const authmiddleware = require("../middleware/auth.middleware");

const authController = require("../controller/auth.controller");
const authRouter = Router();

// Define your authentication routes here

authRouter.post(
  "/register",
  authmiddleware.validateUser,
  authController.registerUser,
);
authRouter.post("/login", authController.loginUser);
authRouter.post(
  "/logout",
  authmiddleware.authMiddleware,
  authController.logoutUser,
);
authRouter.get(
  "/getuser",
  authmiddleware.authMiddleware,
  authController.getUser,
);

module.exports = authRouter;
