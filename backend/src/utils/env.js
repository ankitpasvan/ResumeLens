// Central environment configuration. Validates required variables at
// startup so the app fails fast with a clear message instead of crashing
// later (or worse, running with a missing JWT secret).
const dotenv = require("dotenv");
dotenv.config();

const required = ["MONGO_URI", "JWT_SECRET", "GEMINI_API_KEY"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `Missing required environment variable(s): ${missing.join(", ")}.\n` +
      "Copy backend/.env.example to backend/.env and fill in the values.",
  );
  process.exit(1);
}

// Optional numeric env var with clamping, so a typo can't set an absurd
// value (e.g. AI_TIMEOUT_MS=999999999).
function clampInt(raw, fallback, min, max) {
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  geminiApiKey: process.env.GEMINI_API_KEY,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  // Secure cookies only over HTTPS. In production NODE_ENV must be
  // "production" for this to take effect.
  cookieSecure: process.env.NODE_ENV === "production",
  isProduction: process.env.NODE_ENV === "production",
  // --- AI resilience knobs (all optional) ---
  // Model name override, so a retired/renamed model doesn't require a
  // code change to fix.
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  // Per-request timeout for Gemini calls (ms).
  aiTimeoutMs: clampInt(process.env.AI_TIMEOUT_MS, 25000, 5000, 120000),
  // Retries on transient AI failures (429/5xx/network). Total attempts =
  // aiMaxRetries + 1. Kept small on purpose: retries cost money.
  aiMaxRetries: clampInt(process.env.AI_MAX_RETRIES, 1, 0, 2),
  // Per-user daily cap on AI-powered calls (analyze/match/interview).
  // 429 is returned when exceeded; resets at UTC midnight.
  aiDailyLimit: clampInt(process.env.AI_DAILY_LIMIT, 30, 1, 10000),
  // --- Rate limit knobs (requests per 15-minute window, per IP) ---
  rateLimitAuthMax: clampInt(process.env.RATE_LIMIT_AUTH_MAX, 10, 1, 1000),
  rateLimitAiMax: clampInt(process.env.RATE_LIMIT_AI_MAX, 30, 1, 10000),
  rateLimitGeneralMax: clampInt(
    process.env.RATE_LIMIT_GENERAL_MAX,
    300,
    1,
    100000,
  ),
};
// Step 2 — File path
// backend/src/controller/ats.controller.js
// Step 3 — Action
// MODIFY — AI feedback call wrapped in try/catch: on any AI failure the deterministic findings are still persisted and returned with HTTP 201, empty feedback fields, and a warnings array explaining the degradation (instead of 500/502). All feedback.* reads are now null-safe.
// Step 4 — Complete code (copy-paste ready)
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
  // Graceful degradation: if the AI call fails or returns unusable output,
  // the deterministic findings above still stand — persist and return them
  // with empty feedback instead of failing the whole request.
  let feedback = null;
  let aiDegraded = false;
  try {
    const raw = await generateAtsFeedback({
      resumeText,
      jobDescription,
      findings,
    });
    feedback = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (error) {
    aiDegraded = true;
    console.warn(
      "ATS AI feedback unavailable, returning deterministic results:",
      error.message,
    );
  }

  const analysis = await atsAnalysisModel.create({
    user: req.user.id,
    resumeText,
    jobDescription,
    score: findings.score,
    breakdown: findings.breakdown,
    missingKeywords: findings.missingKeywords,
    summary: feedback?.summary || "",
    strengths: Array.isArray(feedback?.strengths) ? feedback.strengths : [],
    weaknesses: (Array.isArray(feedback?.weaknesses)
      ? feedback.weaknesses
      : []
    ).map((w = {}) => ({
      issue: w.issue || "",
      severity: ["low", "medium", "high"].includes(w.severity)
        ? w.severity
        : "medium",
      suggestion: w.suggestion || "",
    })),
    suggestions: Array.isArray(feedback?.suggestions)
      ? feedback.suggestions
      : [],
  });

  res.status(201).json({
    message: "ATS analysis completed.",
    analysis,
    warnings: aiDegraded
      ? [
          "AI feedback is temporarily unavailable; showing deterministic ATS results only.",
        ]
      : [],
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
