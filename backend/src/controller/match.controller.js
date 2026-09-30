const { generateMatchFeedback } = require("../services/ai.service");
const { matchResumeToJob } = require("../services/match.service");
const jobMatchModel = require("../models/jobMatch.model");
const resumeModel = require("../models/resume.model");
const asyncHandler = require("../utils/asyncHandler");

const MAX_JD_LENGTH = 20000;
const MIN_JD_LENGTH = 20;

// Resolve which resume to match against: an explicit resumeId (owner-scoped),
// otherwise the user's primary resume (falling back to the newest one).
async function resolveResume(userId, resumeId) {
  if (resumeId) {
    return resumeModel.findOne({ _id: resumeId, user: userId });
  }
  return (
    (await resumeModel.findOne({ user: userId, isPrimary: true })) ||
    (await resumeModel.findOne({ user: userId }).sort({ createdAt: -1 }))
  );
}

// Match a stored resume against a job posting. Body:
// { resumeId?, jobTitle, jobDescription }.
const createMatchController = asyncHandler(async (req, res) => {
  const jobTitle = (req.body.jobTitle || "").trim();
  const jobDescription = (req.body.jobDescription || "").trim();

  if (!jobTitle) {
    return res.status(400).json({ error: "Provide a job title." });
  }
  if (jobTitle.length > 120) {
    return res
      .status(400)
      .json({ error: "Job title must be at most 120 characters." });
  }
  if (jobDescription.length < MIN_JD_LENGTH) {
    return res.status(400).json({
      error: `Job description is too short (minimum ${MIN_JD_LENGTH} characters).`,
    });
  }
  if (jobDescription.length > MAX_JD_LENGTH) {
    return res.status(400).json({
      error: `Job description is too long (max ${MAX_JD_LENGTH} characters).`,
    });
  }

  const resume = await resolveResume(req.user.id, req.body.resumeId);
  if (!resume) {
    return res.status(404).json({
      error: req.body.resumeId
        ? "Resume not found."
        : "No resumes found. Save a resume first.",
    });
  }

  // Deterministic, explainable matching — no AI involved here.
  const findings = matchResumeToJob(
    resume.parsedText,
    jobTitle,
    jobDescription,
  );

  // Qualitative feedback from the AI layer (stubbed in smoke tests).
  const raw = await generateMatchFeedback({
    resumeText: resume.parsedText,
    jobTitle,
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

  const match = await jobMatchModel.create({
    user: req.user.id,
    resume: resume._id,
    resumeName: resume.name,
    jobTitle,
    jobDescription,
    matchScore: findings.score,
    breakdown: findings.breakdown.map((b) => ({
      label: b.label,
      score: b.score,
      maxScore: b.maxScore,
      skipped: !!b.skipped,
      details: b.details,
    })),
    matchedSkills: findings.matchedSkills,
    missingSkills: findings.missingSkills,
    summary: feedback.summary || "",
    recommendations: Array.isArray(feedback.recommendations)
      ? feedback.recommendations
      : [],
  });

  res.status(201).json({
    message: "Job match completed.",
    match,
  });
});

// History of the user's past matches, newest first. The full job
// description is excluded here — fetch a single match for the details.
const listMatchesController = asyncHandler(async (req, res) => {
  const matches = await jobMatchModel
    .find({ user: req.user.id })
    .select("-jobDescription")
    .sort({ createdAt: -1 });

  res.status(200).json({
    message: "Job matches fetched successfully.",
    matches,
  });
});

// Single match, owner-scoped (same IDOR protection as ATS/interview).
const getMatchController = asyncHandler(async (req, res) => {
  const match = await jobMatchModel.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!match) {
    return res.status(404).json({ error: "Job match not found." });
  }

  res.status(200).json({
    message: "Job match fetched successfully.",
    match,
  });
});

module.exports = {
  createMatchController,
  listMatchesController,
  getMatchController,
};
