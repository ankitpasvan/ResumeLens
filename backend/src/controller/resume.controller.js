const { PDFParse } = require("pdf-parse");
const resumeModel = require("../models/resume.model");
const asyncHandler = require("../utils/asyncHandler");

const MAX_TEXT_LENGTH = 60000;

async function parsePdfBuffer(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return parsed?.text?.trim() || "";
  } catch (error) {
    console.warn("Failed to parse resume PDF:", error.message);
    return "";
  } finally {
    await parser.destroy().catch(() => {});
  }
}

function cleanName(raw, fallback) {
  const name = (raw || "").trim();
  return name ? name.slice(0, 80) : fallback;
}

const uploadResumeController = asyncHandler(async (req, res) => {
  if (!req.file?.buffer) {
    return res.status(400).json({ error: "Provide a resume PDF to upload." });
  }

  const parsedText = await parsePdfBuffer(req.file.buffer);
  if (!parsedText) {
    return res
      .status(422)
      .json({ error: "Could not read any text from this PDF." });
  }
  if (parsedText.length > MAX_TEXT_LENGTH) {
    return res
      .status(400)
      .json({ error: "Resume text is too long (max 60000 characters)." });
  }

  const existingCount = await resumeModel.countDocuments({ user: req.user.id });
  const resume = await resumeModel.create({
    user: req.user.id,
    name: cleanName(req.body.name, req.file.originalname || "My resume"),
    originalFileName: req.file.originalname,
    parsedText,
    source: "upload",
    isPrimary: existingCount === 0,
  });

  res.status(201).json({ message: "Resume uploaded.", resume });
});

const createResumeFromTextController = asyncHandler(async (req, res) => {
  const parsedText = (req.body.resumeText || "").trim();

  if (!parsedText) {
    return res.status(400).json({ error: "Provide the resume text." });
  }
  if (parsedText.length > MAX_TEXT_LENGTH) {
    return res
      .status(400)
      .json({ error: "Resume text is too long (max 60000 characters)." });
  }

  const existingCount = await resumeModel.countDocuments({ user: req.user.id });
  const resume = await resumeModel.create({
    user: req.user.id,
    name: cleanName(req.body.name, "My resume"),
    parsedText,
    source: "paste",
    isPrimary: existingCount === 0,
  });

  res.status(201).json({ message: "Resume saved.", resume });
});

const listResumesController = asyncHandler(async (req, res) => {
  const resumes = await resumeModel
    .find({ user: req.user.id })
    .select("-parsedText")
    .sort({ createdAt: -1 });

  res.status(200).json({ message: "Resumes fetched successfully.", resumes });
});

const getResumeController = asyncHandler(async (req, res) => {
  const resume = await resumeModel.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!resume) {
    return res.status(404).json({ error: "Resume not found." });
  }

  res.status(200).json({ message: "Resume fetched successfully.", resume });
});

const getPrimaryResumeController = asyncHandler(async (req, res) => {
  const resume =
    (await resumeModel.findOne({ user: req.user.id, isPrimary: true })) ||
    (await resumeModel.findOne({ user: req.user.id }).sort({ createdAt: -1 }));

  if (!resume) {
    return res.status(404).json({ error: "No resumes found." });
  }

  res
    .status(200)
    .json({ message: "Primary resume fetched successfully.", resume });
});

const setPrimaryResumeController = asyncHandler(async (req, res) => {
  const resume = await resumeModel.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!resume) {
    return res.status(404).json({ error: "Resume not found." });
  }

  await resumeModel.updateMany(
    { user: req.user.id },
    { $set: { isPrimary: false } },
  );
  resume.isPrimary = true;
  await resume.save();

  res.status(200).json({ message: "Primary resume updated.", resume });
});

const deleteResumeController = asyncHandler(async (req, res) => {
  const resume = await resumeModel.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!resume) {
    return res.status(404).json({ error: "Resume not found." });
  }

  if (resume.isPrimary) {
    const next = await resumeModel
      .findOne({ user: req.user.id })
      .sort({ createdAt: -1 });
    if (next) {
      next.isPrimary = true;
      await next.save();
    }
  }

  res.status(200).json({ message: "Resume deleted." });
});

module.exports = {
  uploadResumeController,
  createResumeFromTextController,
  listResumesController,
  getResumeController,
  getPrimaryResumeController,
  setPrimaryResumeController,
  deleteResumeController,
};
