const { Router } = require("express");
const authmiddleware = require("../middleware/auth.middleware");
const { authLimiter } = require("../middleware/rateLimit.middleware");

const authController = require("../controller/auth.controller");
const authRouter = Router();

authRouter.post(
  "/register",
  authLimiter,
  authmiddleware.validateRegister,
  authController.registerUser,
);
authRouter.post("/login", authLimiter, authController.loginUser);
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
authRouter.patch(
  "/password",
  authmiddleware.authMiddleware,
  authController.changePasswordController,
);
authRouter.delete(
  "/account",
  authmiddleware.authMiddleware,
  authController.deleteAccountController,
);

authRouter.post("/google", authLimiter, authController.googleLogin);

module.exports = authRouter;
