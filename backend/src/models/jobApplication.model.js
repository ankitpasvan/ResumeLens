const mongoose = require("mongoose");

// Tracks one job application through the pipeline:
// saved → applied → assessment → interview → offer (or rejected).
// Every status change is appended to `statusHistory` so the user can see
// the full journey. All records are owner-scoped via `user`.
const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "assessment",
  "interview",
  "offer",
  "rejected",
];

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Status note must be at most 500 characters"],
      default: "",
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const jobApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    savedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SavedJob",
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobMatch",
    },
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [120, "Job title must be at most 120 characters"],
    },
    company: {
      type: String,
      trim: true,
      maxlength: [120, "Company name must be at most 120 characters"],
      default: "",
    },
    description: {
      type: String,
      trim: true,
      maxlength: [20000, "Job description is too long (max 20000 characters)"],
      default: "",
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: "saved",
      index: true,
    },
    statusHistory: [statusHistorySchema],
    notes: {
      type: String,
      trim: true,
      maxlength: [5000, "Notes must be at most 5000 characters"],
      default: "",
    },
    nextStep: {
      type: String,
      trim: true,
      maxlength: [200, "Next step must be at most 200 characters"],
      default: "",
    },
    nextStepDate: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
module.exports.APPLICATION_STATUSES = APPLICATION_STATUSES;
