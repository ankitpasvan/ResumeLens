const mongoose = require("mongoose");

const technicalQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    expectedAnswer: { type: String },
  },
  { _id: false },
);

const behavioralQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    tip: { type: String },
  },
  { _id: false },
);

const skillgapSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    suggestion: { type: String },
  },
  { _id: false },
);

const preparationPlanSchema = new mongoose.Schema(
  {
    day: { type: Number },
    focus: { type: String },
    tasks: [{ type: String }],
  },
  { _id: false },
);

const interviewReportSchema = new mongoose.Schema(
  {
    jobDescription: {
      type: String,
      required: [true, "Job description is required"],
    },
    resume: { type: String },
    selfDescription: { type: String },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps: [skillgapSchema],
    preparationPlan: [preparationPlanSchema],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

const interviewReportModel = mongoose.model("Interview", interviewReportSchema);
module.exports = interviewReportModel;
