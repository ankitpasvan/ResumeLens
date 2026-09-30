const mongoose = require("mongoose");

// A persisted resume↔job match result. The numeric score and the
// matched/missing skill lists are computed deterministically (see
// match.service.js); the AI layer only adds qualitative summary and
// recommendations. Everything is owner-scoped via `user`.
const jobMatchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
    },
    resumeName: {
      type: String,
      trim: true,
      maxlength: [80, "Resume name must be at most 80 characters"],
    },
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [120, "Job title must be at most 120 characters"],
    },
    jobDescription: {
      type: String,
      required: [true, "Job description is required"],
      maxlength: [20000, "Job description is too long (max 20000 characters)"],
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    breakdown: [
      {
        label: { type: String, required: true },
        score: { type: Number, required: true },
        maxScore: { type: Number, required: true },
        skipped: { type: Boolean, default: false },
        details: [{ type: String }],
      },
    ],
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    summary: {
      type: String,
      default: "",
    },
    strengths: [{ type: String }],
    gaps: [
      {
        issue: { type: String, default: "" },
        severity: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
        suggestion: { type: String, default: "" },
      },
    ],
    recommendations: [{ type: String }],
  },
  { timestamps: true },
);

jobMatchSchema.index({ user: 1, createdAt: -1 });

const JobMatchModel = mongoose.model("JobMatch", jobMatchSchema);
module.exports = JobMatchModel;
