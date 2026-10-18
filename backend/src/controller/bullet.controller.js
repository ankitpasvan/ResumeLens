const {
  generateBulletImprovements,
  AiServiceError,
} = require("../services/ai.service");
const resumeModel = require("../models/resume.model");
const asyncHandler = require("../utils/asyncHandler");

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

  const resumeDoc =
    (await resumeModel.findOne({ user: req.user.id, isPrimary: true })) ||
    (await resumeModel.findOne({ user: req.user.id }).sort({ createdAt: -1 }));
  const resumeText = resumeDoc?.parsedText || "";

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
