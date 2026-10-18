const userModel = require("../models/user.model");
const blacklistModel = require("../models/blacklist.model");
const resumeModel = require("../models/resume.model");
const atsAnalysisModel = require("../models/atsAnalysis.model");
const jobMatchModel = require("../models/jobMatch.model");
const savedJobModel = require("../models/savedJob.model");
const jobApplicationModel = require("../models/jobApplication.model");
const interviewReportModel = require("../models/interviewReport.model");
const aiUsageModel = require("../models/aiUsage.model");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const config = require("../utils/env");
const asyncHandler = require("../utils/asyncHandler");

const cookieOptions = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000, // 24h
};

function signToken(user) {
  return jwt.sign(
    { id: user._id, userId: user._id, email: user.email, jti: randomUUID() },
    config.jwtSecret,
    { expiresIn: "24h" },
  );
}

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ error: "User already exists" });
  }

  const newUser = await userModel.create({ username, email, password });

  // Auto-login: issue a session cookie right after registration.
  const token = signToken(newUser);

  const userResponse = newUser.toObject();
  delete userResponse.password;

  res
    .cookie("token", token, cookieOptions)
    .status(201)
    .json({ message: "User registered successfully", user: userResponse });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await userModel.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user);

  const userResponse = user.toObject();
  delete userResponse.password;

  res.cookie("token", token, cookieOptions).status(200).json({
    message: "User logged in successfully",
    user: userResponse,
  });
});

// Revokes the current session token so it cannot be used again.
const logoutUser = asyncHandler(async (req, res) => {
  const token = req.cookies?.token;

  if (token) {
    let expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        expiresAt = new Date(decoded.exp * 1000);
      }
      await blacklistModel.create({ token, expiresAt });
    } catch {
      // If the token can't be decoded, just clear the cookie.
    }
  }

  res.clearCookie("token").status(200).json({
    message: "User logged out successfully",
  });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.id).select("-password");
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.status(200).json({ success: true, user });
});

const changePasswordController = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Current password and new password are required." });
  }

  const user = await userModel.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ error: "Current password is incorrect." });
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters long." });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ message: "Password changed successfully." });
});

const deleteAccountController = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required." });
  }

  const user = await userModel.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ error: "Password is incorrect." });
  }

  const userId = user._id;

  await Promise.all([
    resumeModel.deleteMany({ user: userId }),
    atsAnalysisModel.deleteMany({ user: userId }),
    jobMatchModel.deleteMany({ user: userId }),
    savedJobModel.deleteMany({ user: userId }),
    jobApplicationModel.deleteMany({ user: userId }),
    interviewReportModel.deleteMany({ user: userId }),
    aiUsageModel.deleteMany({ user: userId }),
  ]);
  await userModel.findByIdAndDelete(userId);

  const token = req.cookies?.token;
  if (token) {
    let expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        expiresAt = new Date(decoded.exp * 1000);
      }
      await blacklistModel.create({ token, expiresAt });
    } catch {}
  }

  res.clearCookie("token").status(204).end();
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  changePasswordController,
  deleteAccountController,
};
