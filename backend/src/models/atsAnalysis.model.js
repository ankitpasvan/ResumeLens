const mongoose = require("mongoose");

// One persisted ATS analysis. The numeric score and its breakdown are
// produced deterministically by ats.service.js; the qualitative fields
// (summary/strengths/weaknesses/suggestions) come from the AI feedback
// layer. Storing both keeps the history view fast and reproducible.
const breakdownItemSchema = new mongoose.Schema(
  {
    key: { type: String },
    label: { type: String },
    score: { type: Number },
    maxScore: { type: Number },
    skipped: { type: Boolean, default: false },
    details: [{ type: String }],
  },
  { _id: false },
);

const weaknessSchema = new mongoose.Schema(
  {
    issue: { type: String },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    suggestion: { type: String },
  },
  { _id: false },
);

const atsAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resumeText: { type: String },
    jobDescription: { type: String },
    score: { type: Number, min: 0, max: 100 },
    breakdown: [breakdownItemSchema],
    missingKeywords: [{ type: String }],
    summary: { type: String },
    strengths: [{ type: String }],
    weaknesses: [weaknessSchema],
    suggestions: [{ type: String }],
  },
  { timestamps: true },
);

const atsAnalysisModel = mongoose.model("AtsAnalysis", atsAnalysisSchema);
module.exports = atsAnalysisModel;
