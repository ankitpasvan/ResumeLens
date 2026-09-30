const mongoose = require("mongoose");

// A user's stored resume. The parsed text is kept so ATS analysis, job
// matching and recommendations can reuse it without re-uploading.
// Exactly one resume per user is the "primary" resume.
const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Resume name is required"],
      trim: true,
      maxlength: [80, "Resume name must be at most 80 characters"],
    },
    originalFileName: {
      type: String,
      trim: true,
      maxlength: [160, "File name must be at most 160 characters"],
    },
    parsedText: {
      type: String,
      required: [true, "Resume text is required"],
      maxlength: [60000, "Resume text is too long (max 60000 characters)"],
    },
    source: {
      type: String,
      enum: ["upload", "paste"],
      required: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

resumeSchema.index({ user: 1, createdAt: -1 });

const ResumeModel = mongoose.model("Resume", resumeSchema);
module.exports = ResumeModel;
