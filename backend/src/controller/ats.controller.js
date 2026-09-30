const { PDFParse } = require("pdf-parse");
const { generateAtsFeedback } = require("../services/ai.service");
const { analyzeAts } = require("../services/ats.service");
const atsAnalysisModel = require("../models/atsAnalysis.model");
const asyncHandler = require("../utils/asyncHandler");

// Resume text comes from the uploaded PDF when present, otherwise from the
// resumeText field (useful for API clients and tests).
async function getResumeText(req) {
  if (req.file?.buffer) {
    const parser = new PDFParse({ data: req.file.buffer });
    try {
      const parsed = await parser.getText();
      if (parsed?.text?.trim()) return parsed.text;
    } catch (error) {
      console.warn("Failed to parse resume PDF:", error.message);
    } finally {
      await parser.destroy().catch(() => {});
    }
  }
  return (req.body.resumeText || "").trim();
}

const analyzeAtsController = asyncHandler(async (req, res) => {
  const resumeText = await getResumeText(req);
  const jobDescription = (req.body.jobDescription || "").trim();

  if (!resumeText) {
    return res
      .status(400)
      .json({ error: "Provide a resume PDF or resumeText." });
  }

  if (resumeText.length > 60000) {
    return res
      .status(400)
      .json({ error: "Resume text is too long (max 60000 characters)." });
  }

  // Deterministic, explainable scoring — no AI involved here.
  const findings = analyzeAts(resumeText, jobDescription);

  // Qualitative feedback from the AI layer (stubbed in smoke tests).
  const raw = await generateAtsFeedback({
    resumeText,
    jobDescription,
    findings,
  });

  let feedback;
  try {
    feedback = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return res.status(502).json({
      error: "AI service returned an invalid response. Please try again.",
    });
  }

  const analysis = await atsAnalysisModel.create({
    user: req.user.id,
    resumeText,
    jobDescription,
    score: findings.score,
    breakdown: findings.breakdown,
    missingKeywords: findings.missingKeywords,
    summary: feedback.summary || "",
    strengths: Array.isArray(feedback.strengths) ? feedback.strengths : [],
    weaknesses: (Array.isArray(feedback.weaknesses)
      ? feedback.weaknesses
      : []
    ).map((w = {}) => ({
      issue: w.issue || "",
      severity: ["low", "medium", "high"].includes(w.severity)
        ? w.severity
        : "medium",
      suggestion: w.suggestion || "",
    })),
    suggestions: Array.isArray(feedback.suggestions)
      ? feedback.suggestions
      : [],
  });

  res.status(201).json({
    message: "ATS analysis completed.",
    analysis,
  });
});

const listAtsController = asyncHandler(async (req, res) => {
  const analyses = await atsAnalysisModel
    .find({ user: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    message: "ATS analyses fetched successfully.",
    analyses,
  });
});

// Owner-scoped: users can only read their own analyses (same IDOR
// protection as the interview report endpoints).
const getAtsController = asyncHandler(async (req, res) => {
  const analysis = await atsAnalysisModel.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!analysis) {
    return res.status(404).json({ error: "ATS analysis not found." });
  }

  res.status(200).json({
    message: "ATS analysis fetched successfully.",
    analysis,
  });
});

module.exports = {
  analyzeAtsController,
  listAtsController,
  getAtsController,
};
