const {
  generateBulletImprovements,
  AiServiceError,
} = require("../services/ai.service");
const resumeModel = require("../models/resume.model");
const asyncHandler = require("../utils/asyncHandler");

// Improves a single resume bullet using AI. The rewrite is grounded on the
// user's primary (or newest) resume text so quantified impact is drawn only
// from real resume content, never invented by the model.
const improveBulletController = asyncHandler(async (req, res) => {
  const { bullet = "", jobDescription = "" } = req.body || {};

  const trimmedBullet = typeof bullet === "string" ? bullet.trim() : "";
  if (trimmedBullet.length < 10 || trimmedBullet.length > 500) {
    return res.status(400).json({
      error: "A resume bullet between 10 and 500 characters is required.",
    });
  }

  const jdText =
    typeof jobDescription === "string" ? jobDescription.trim() : "";

  // Primary resume first, newest one as fallback — mirrors
  // getPrimaryResumeController in resume.controller.js.
  const resumeDoc =
    (await resumeModel.findOne({ user: req.user.id, isPrimary: true })) ||
    (await resumeModel.findOne({ user: req.user.id }).sort({ createdAt: -1 }));
  const resumeText = resumeDoc?.parsedText || "";

  // The improvement is fully AI-generated, so there is no deterministic
  // fallback — a failure surfaces as a clear 503 (transient) or 502,
  // exactly like the interview report endpoint.
  let rawResponse;
  try {
    rawResponse = await generateBulletImprovements({
      bullet: trimmedBullet,
      resumeText,
      jobDescription: jdText,
    });
  } catch (error) {
    const transient = error instanceof AiServiceError ? error.transient : false;
    return res.status(transient ? 503 : 502).json({
      error:
        "AI service is temporarily unavailable. Please try again in a moment.",
    });
  }

  let result;
  try {
    result =
      typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;
  } catch {
    return res.status(502).json({
      error: "AI service returned an invalid response. Please try again.",
    });
  }

  if (!Array.isArray(result.improved) || result.improved.length === 0) {
    return res.status(502).json({
      error: "AI service returned an invalid response. Please try again.",
    });
  }

  res.status(200).json({
    improved: result.improved,
    tips: Array.isArray(result.tips) ? result.tips : [],
  });
});

module.exports = { improveBulletController };
