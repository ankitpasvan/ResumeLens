const mongoose = require("mongoose");

const savedJobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes must be at most 2000 characters"],
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SavedJob", savedJobSchema);
