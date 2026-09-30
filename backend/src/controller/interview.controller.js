const { PDFParse } = require("pdf-parse");
const {
  generateInterviewReport,
  generateResumePdf,
} = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");
const asyncHandler = require("../utils/asyncHandler");

const generateInterViewReportController = asyncHandler(async (req, res) => {
  let resumeText = "";

  // Extract text from the uploaded resume PDF (if provided).
  if (req.file?.buffer) {
    const parser = new PDFParse({ data: req.file.buffer });
    try {
      const parsed = await parser.getText();
      resumeText = parsed?.text || "";
    } catch (error) {
      console.warn("Failed to parse resume PDF:", error.message);
    } finally {
      await parser.destroy().catch(() => {});
    }
  }

  const { selfDescription = "", jobDescription = "" } = req.body;

  if (!jobDescription.trim()) {
    return res.status(400).json({ error: "Job description is required." });
  }

  if (!resumeText && !selfDescription.trim()) {
    return res.status(400).json({
      error: "Please upload a resume PDF or provide a self-description.",
    });
  }

  const rawResponse = await generateInterviewReport({
    resume: resumeText,
    selfDescription: selfDescription.trim(),
    jobDescription: jobDescription.trim(),
  });

  let aiReport;
  try {
    aiReport =
      typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;
  } catch {
    return res.status(502).json({
      error: "AI service returned an invalid response. Please try again.",
    });
  }

  const matchScore = Number(aiReport.matchScore);
  if (!Number.isFinite(matchScore)) {
    return res.status(502).json({
      error: "AI service returned an invalid response. Please try again.",
    });
  }

  // Normalize the AI output into the canonical report shape. The fallbacks
  // tolerate older field names in case the model drifts from the schema.
  const normalizeTechnical = (q = {}) => ({
    question: q.question || "",
    difficulty: ["Easy", "Medium", "Hard"].includes(q.difficulty)
      ? q.difficulty
      : "Medium",
    expectedAnswer: q.expectedAnswer || q.answer || "",
  });

  const normalizeBehavioral = (q = {}) => ({
    question: q.question || "",
    tip: q.tip || q.intention || "",
  });

  const normalizeSkillGap = (g = {}) => ({
    skill: g.skill || "",
    severity: ["low", "medium", "high"].includes(g.severity)
      ? g.severity
      : "medium",
    suggestion: g.suggestion || "",
  });

  const normalizePlanDay = (d = {}) => ({
    day: Number(d.day) || undefined,
    focus: d.focus || "",
    tasks: Array.isArray(d.tasks) ? d.tasks : [],
  });

  const interviewReport = await interviewReportModel.create({
    user: req.user.id,
    resume: resumeText,
    selfDescription: selfDescription.trim(),
    jobDescription: jobDescription.trim(),
    matchScore: Math.min(100, Math.max(0, Math.round(matchScore))),
    technicalQuestions: (aiReport.technicalQuestions || []).map(
      normalizeTechnical,
    ),
    behavioralQuestions: (aiReport.behavioralQuestions || []).map(
      normalizeBehavioral,
    ),
    skillGaps: (aiReport.skillGaps || aiReport.skillgaps || []).map(
      normalizeSkillGap,
    ),
    preparationPlan: (
      aiReport.preparationPlan ||
      aiReport.preparationPlans ||
      []
    ).map(normalizePlanDay),
  });

  res.status(201).json({
    message: "Interview report generated successfully.",
    interviewReport,
  });
});

const getInterViewReportController = asyncHandler(async (req, res) => {
  const interviewReports = await interviewReportModel
    .find({ user: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    message: "Interview reports fetched successfully.",
    interviewReports,
  });
});

const getInterViewReportByIdController = asyncHandler(async (req, res) => {
  const { interviewReportId } = req.params;

  const interviewReport = await interviewReportModel.findOne({
    _id: interviewReportId,
    user: req.user.id,
  });

  if (!interviewReport) {
    return res.status(404).json({ error: "Interview report not found." });
  }

  res.status(200).json({
    message: "Interview report fetched successfully.",
    interviewReport,
  });
});

// Streams a PDF of the candidate's resume. Ownership is enforced: users can
// only access PDFs generated from their own reports.
const getResumePdfController = asyncHandler(async (req, res) => {
  const { interviewReportId } = req.params;

  const interviewReport = await interviewReportModel.findOne({
    _id: interviewReportId,
    user: req.user.id,
  });

  if (!interviewReport) {
    return res.status(404).json({ error: "Interview report not found." });
  }

  const pdfBuffer = await generateResumePdf(interviewReport.resume);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="resume-${interviewReportId}.pdf"`,
  );
  res.send(pdfBuffer);
});

module.exports = {
  generateInterViewReportController,
  getInterViewReportController,
  getInterViewReportByIdController,
  getResumePdfController,
};
