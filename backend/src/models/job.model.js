const mongoose = require("mongoose");

// A job posting on the shared job board. Any authenticated user can browse
// open jobs; only the owner can edit or close their own posting. Jobs can
// be created manually ("manual") or captured from a resume↔job match
// ("match", referencing the originating JobMatch).
const jobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [120, "Job title must be at most 120 characters"],
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [120, "Company name must be at most 120 characters"],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [120, "Location must be at most 120 characters"],
      default: "",
    },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "freelance"],
      default: "full-time",
    },
    workMode: {
      type: String,
      enum: ["remote", "on-site", "hybrid"],
      default: "on-site",
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      maxlength: [20000, "Job description is too long (max 20000 characters)"],
    },
    requirements: [{ type: String, maxlength: 300 }],
    skills: [{ type: String, maxlength: 60 }],
    salaryMin: {
      type: Number,
      min: 0,
    },
    salaryMax: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      maxlength: [6, "Currency must be at most 6 characters"],
      default: "INR",
    },
    status: {
      type: String,
      enum: ["draft", "open", "closed"],
      default: "open",
      index: true,
    },
    source: {
      type: String,
      enum: ["manual", "match"],
      default: "manual",
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobMatch",
    },
  },
  { timestamps: true },
);

jobSchema.index({ title: "text", company: "text", description: "text" });

module.exports = mongoose.model("Job", jobSchema);
