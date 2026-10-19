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
const { OAuth2Client } = require("google-auth-library");
const config = require("../utils/env");
const asyncHandler = require("../utils/asyncHandler");

const cookieOptions = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000, // 24h
};

// Google ID token verifier. The audience MUST be our own Client ID —
// this is what proves the token was minted for our app, not someone else's.
const googleClient = new OAuth2Client(config.googleClientId);

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

// Google Login via Google Identity Services ID token.
// The frontend sends the `credential` (JWT) it received from Google.
// We verify it server-side — never trust email/name from the client alone.
const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential || typeof credential !== "string") {
    return res.status(400).json({ error: "Google credential is required." });
  }

  if (!config.googleClientId) {
    return res
      .status(500)
      .json({ error: "Google login is not configured on the server." });
  }

  // Verify the token signature, expiry, and audience with Google.
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    });
    payload = ticket.getPayload();
  } catch (error) {
    return res
      .status(401)
      .json({ error: "Invalid Google token. Please try again." });
  }

  const googleId = payload?.sub;
  const email = payload?.email?.toLowerCase().trim();
  const emailVerified = payload?.email_verified === true;

  if (!googleId || !email || !emailVerified) {
    return res
      .status(401)
      .json({ error: "Google account verification failed." });
  }

  // Case 1: Returning Google user — log them in.
  let user = await userModel.findOne({ googleId });

  if (!user) {
    // Case 2: Email already registered via password — DO NOT auto-link.
    // Silent linking would allow account takeover, so we return 409 and
    // ask the user to log in with their password instead.
    const existingByEmail = await userModel.findOne({ email });
    if (existingByEmail) {
      return res.status(409).json({
        error:
          "An account with this email already exists. Please log in with your password.",
        code: "EMAIL_EXISTS",
      });
    }

    // Case 3: Brand new Google user — create the account (no password).
    const rawName = (payload?.name || "").trim();
    const baseName = rawName || email.split("@")[0];
    const username =
      baseName.length >= 3
        ? baseName.slice(0, 50)
        : `user_${googleId.slice(0, 8)}`;

    user = await userModel.create({ username, email, googleId });
  }

  // Issue our own JWT session cookie — identical to password login.
  const token = signToken(user);

  const userResponse = user.toObject();
  delete userResponse.password;

  res.cookie("token", token, cookieOptions).status(200).json({
    message: "Logged in with Google successfully",
    user: userResponse,
  });
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  changePasswordController,
  deleteAccountController,
  googleLogin,
};
