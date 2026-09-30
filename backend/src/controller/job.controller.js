const jobModel = require("../models/job.model");
const savedJobModel = require("../models/savedJob.model");
const jobApplicationModel = require("../models/jobApplication.model");
const { APPLICATION_STATUSES } = require("../models/jobApplication.model");
const asyncHandler = require("../utils/asyncHandler");

const JOB_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "freelance",
];
const WORK_MODES = ["remote", "on-site", "hybrid"];
const JOB_STATUSES = ["draft", "open", "closed"];
const MAX_DESCRIPTION_LENGTH = 20000;
const MIN_DESCRIPTION_LENGTH = 20;

function cleanString(value, max) {
  const text = (value || "").trim();
  return text.length > max ? text.slice(0, max) : text;
}

function cleanList(value, maxItem) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (item || "").toString().trim())
    .filter(Boolean)
    .slice(0, 50)
    .map((item) => (item.length > maxItem ? item.slice(0, maxItem) : item));
}

function cleanSalary(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return undefined;
  return Math.round(num);
}

// Shared validation for job create/update bodies. Returns an error string
// or null when valid.
function validateJobBody(body) {
  const title = (body.title || "").trim();
  const company = (body.company || "").trim();
  const description = (body.description || "").trim();

  if (!title) return "Job title is required.";
  if (title.length > 120) return "Job title must be at most 120 characters.";
  if (!company) return "Company name is required.";
  if (company.length > 120)
    return "Company name must be at most 120 characters.";
  if (description.length < MIN_DESCRIPTION_LENGTH)
    return `Job description is too short (minimum ${MIN_DESCRIPTION_LENGTH} characters).`;
  if (description.length > MAX_DESCRIPTION_LENGTH)
    return `Job description is too long (max ${MAX_DESCRIPTION_LENGTH} characters).`;
  if (body.jobType && !JOB_TYPES.includes(body.jobType))
    return `Invalid job type. Must be one of: ${JOB_TYPES.join(", ")}.`;
  if (body.workMode && !WORK_MODES.includes(body.workMode))
    return `Invalid work mode. Must be one of: ${WORK_MODES.join(", ")}.`;
  if (body.status && !JOB_STATUSES.includes(body.status))
    return `Invalid status. Must be one of: ${JOB_STATUSES.join(", ")}.`;

  const salaryMin = cleanSalary(body.salaryMin);
  const salaryMax = cleanSalary(body.salaryMax);
  if (
    salaryMin !== undefined &&
    salaryMax !== undefined &&
    salaryMin > salaryMax
  )
    return "Minimum salary cannot be greater than maximum salary.";

  return null;
}

function buildJobDoc(body) {
  return {
    title: (body.title || "").trim(),
    company: (body.company || "").trim(),
    location: cleanString(body.location, 120),
    jobType: JOB_TYPES.includes(body.jobType) ? body.jobType : "full-time",
    workMode: WORK_MODES.includes(body.workMode) ? body.workMode : "on-site",
    description: (body.description || "").trim(),
    requirements: cleanList(body.requirements, 300),
    skills: cleanList(body.skills, 60),
    salaryMin: cleanSalary(body.salaryMin),
    salaryMax: cleanSalary(body.salaryMax),
    currency: cleanString(body.currency, 6) || "INR",
    status: JOB_STATUSES.includes(body.status) ? body.status : "open",
    source: body.source === "match" ? "match" : "manual",
    ...(body.match ? { match: body.match } : {}),
  };
}

// Create a job posting. Body: { title, company, description, location?,
// jobType?, workMode?, requirements?, skills?, salaryMin?, salaryMax?,
// currency?, status? }.
const createJobController = asyncHandler(async (req, res) => {
  const validationError = validateJobBody(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const job = await jobModel.create({
    user: req.user.id,
    ...buildJobDoc(req.body),
  });

  return res.status(201).json({ job });
});

// List jobs: all open postings (shared board) plus the caller's own jobs
// regardless of status. Supports ?q= (title/company/skills), ?jobType=,
// ?status=, ?mine=1 (only own postings).
const listJobsController = asyncHandler(async (req, res) => {
  const query = (req.query.q || "").trim().toLowerCase();
  const jobType = req.query.jobType || "";
  const status = req.query.status || "";
  const mineOnly = req.query.mine === "1";

  const jobs = await jobModel
    .find({})
    .then((rows) =>
      rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    );

  const filtered = jobs.filter((job) => {
    const isMine = String(job.user) === String(req.user.id);
    if (mineOnly && !isMine) return false;
    // Others' drafts are never visible.
    if (!isMine && job.status !== "open") return false;
    if (status && job.status !== status) return false;
    if (jobType && job.jobType !== jobType) return false;
    if (query) {
      const haystack = [
        job.title,
        job.company,
        job.location,
        job.description,
        (job.skills || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  // Strip long descriptions from the list view.
  const summarized = filtered.map((job) => {
    const plain = typeof job.toObject === "function" ? job.toObject() : job;
    const description = plain.description || "";
    return {
      ...plain,
      description:
        description.length > 400
          ? `${description.slice(0, 400)}…`
          : description,
      isMine: String(job.user) === String(req.user.id),
    };
  });

  return res.status(200).json({ jobs: summarized });
});

// Get a single job in full. Owners also get the applicant count.
const getJobController = asyncHandler(async (req, res) => {
  const job = await jobModel.findOne({ _id: req.params.id });
  if (!job) {
    return res.status(404).json({ error: "Job not found." });
  }

  const isMine = String(job.user) === String(req.user.id);
  if (!isMine && job.status !== "open") {
    return res.status(404).json({ error: "Job not found." });
  }

  const plain =
    typeof job.toObject === "function" ? job.toObject() : { ...job };
  plain.isMine = isMine;

  if (isMine) {
    plain.applicants = await jobApplicationModel.countDocuments({
      job: job._id,
    });
  }

  return res.status(200).json({ job: plain });
});

// Update a job — owner only.
const updateJobController = asyncHandler(async (req, res) => {
  const validationError = validateJobBody(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const job = await jobModel.findOne({ _id: req.params.id, user: req.user.id });
  if (!job) {
    return res.status(404).json({ error: "Job not found." });
  }

  Object.assign(job, buildJobDoc(req.body));
  await job.save();

  return res.status(200).json({ job });
});

// Delete a job — owner only.
const deleteJobController = asyncHandler(async (req, res) => {
  const result = await jobModel.deleteOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!result || result.deletedCount === 0) {
    return res.status(404).json({ error: "Job not found." });
  }
  return res.status(204).send();
});

// Save a job for later. Body: { jobId?, jobTitle?, company?, description?,
// matchId?, notes? }. Duplicates are rejected with 409.
const createSavedJobController = asyncHandler(async (req, res) => {
  let snapshot = {
    job: undefined,
    match: req.body.matchId || undefined,
    jobTitle: cleanString(req.body.jobTitle, 120),
    company: cleanString(req.body.company, 120),
    description: cleanString(req.body.description, MAX_DESCRIPTION_LENGTH),
    notes: cleanString(req.body.notes, 2000),
  };

  if (req.body.jobId) {
    const job = await jobModel.findOne({ _id: req.body.jobId });
    if (
      !job ||
      (String(job.user) !== String(req.user.id) && job.status !== "open")
    ) {
      return res.status(404).json({ error: "Job not found." });
    }
    snapshot = {
      job: job._id,
      match: snapshot.match,
      jobTitle: job.title,
      company: job.company,
      description: job.description,
      notes: snapshot.notes,
    };
    const existing = await savedJobModel.findOne({
      user: req.user.id,
      job: job._id,
    });
    if (existing) {
      return res.status(409).json({ error: "This job is already saved." });
    }
  } else {
    if (!snapshot.jobTitle) {
      return res.status(400).json({ error: "Job title is required." });
    }
    const existing = await savedJobModel.findOne({
      user: req.user.id,
      jobTitle: new RegExp(`^${escapeRegex(snapshot.jobTitle)}$`, "i"),
      company: new RegExp(`^${escapeRegex(snapshot.company)}$`, "i"),
    });
    if (existing) {
      return res.status(409).json({ error: "This job is already saved." });
    }
  }

  const saved = await savedJobModel.create({ user: req.user.id, ...snapshot });
  return res.status(201).json({ savedJob: saved });
});

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// List the user's saved jobs, newest first.
const listSavedJobsController = asyncHandler(async (req, res) => {
  const saved = await savedJobModel
    .find({ user: req.user.id })
    .then((rows) =>
      rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    );
  return res.status(200).json({ savedJobs: saved });
});

// Remove a saved job — owner only.
const deleteSavedJobController = asyncHandler(async (req, res) => {
  const result = await savedJobModel.deleteOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!result || result.deletedCount === 0) {
    return res.status(404).json({ error: "Saved job not found." });
  }
  return res.status(204).send();
});

// Start tracking an application. Body: { savedJobId?, jobId?, jobTitle?,
// company?, description?, matchScore?, status? ("saved" | "applied"),
// notes? }. When a savedJobId is given, its snapshot is used.
const createApplicationController = asyncHandler(async (req, res) => {
  let snapshot = {
    savedJob: undefined,
    job: undefined,
    match: undefined,
    jobTitle: cleanString(req.body.jobTitle, 120),
    company: cleanString(req.body.company, 120),
    description: cleanString(req.body.description, MAX_DESCRIPTION_LENGTH),
    notes: cleanString(req.body.notes, 5000),
  };

  if (req.body.savedJobId) {
    const saved = await savedJobModel.findOne({
      _id: req.body.savedJobId,
      user: req.user.id,
    });
    if (!saved) {
      return res.status(404).json({ error: "Saved job not found." });
    }
    snapshot = {
      savedJob: saved._id,
      job: saved.job,
      match: saved.match,
      jobTitle: saved.jobTitle,
      company: saved.company,
      description: saved.description,
      notes: snapshot.notes,
    };
  } else if (req.body.jobId) {
    const job = await jobModel.findOne({ _id: req.body.jobId });
    if (
      !job ||
      (String(job.user) !== String(req.user.id) && job.status !== "open")
    ) {
      return res.status(404).json({ error: "Job not found." });
    }
    snapshot = {
      savedJob: undefined,
      job: job._id,
      match: undefined,
      jobTitle: job.title,
      company: job.company,
      description: job.description,
      notes: snapshot.notes,
    };
  } else if (!snapshot.jobTitle) {
    return res.status(400).json({ error: "Job title is required." });
  }

  const status = req.body.status === "saved" ? "saved" : "applied";
  const matchScore =
    Number.isFinite(Number(req.body.matchScore)) &&
    Number(req.body.matchScore) >= 0 &&
    Number(req.body.matchScore) <= 100
      ? Number(req.body.matchScore)
      : undefined;

  const application = await jobApplicationModel.create({
    user: req.user.id,
    ...snapshot,
    matchScore,
    status,
    statusHistory: [{ status, note: "Application created", at: new Date() }],
  });

  return res.status(201).json({ application });
});

// List the user's applications, newest first. Supports ?status=.
const listApplicationsController = asyncHandler(async (req, res) => {
  const status = req.query.status || "";
  const applications = await jobApplicationModel
    .find({ user: req.user.id })
    .then((rows) =>
      rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    );

  const filtered = status
    ? applications.filter((a) => a.status === status)
    : applications;

  return res.status(200).json({ applications: filtered });
});

// Move an application to a new pipeline status. Body: { status, note? }.
const updateApplicationStatusController = asyncHandler(async (req, res) => {
  const status = (req.body.status || "").trim();
  if (!APPLICATION_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${APPLICATION_STATUSES.join(", ")}.`,
    });
  }

  const application = await jobApplicationModel.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!application) {
    return res.status(404).json({ error: "Application not found." });
  }

  application.status = status;
  application.statusHistory = [
    ...(application.statusHistory || []),
    { status, note: cleanString(req.body.note, 500), at: new Date() },
  ];
  await application.save();

  return res.status(200).json({ application });
});

// Edit an application's notes / next step. Body: { notes?, nextStep?,
// nextStepDate? }.
const updateApplicationController = asyncHandler(async (req, res) => {
  const application = await jobApplicationModel.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!application) {
    return res.status(404).json({ error: "Application not found." });
  }

  if (req.body.notes !== undefined) {
    application.notes = cleanString(req.body.notes, 5000);
  }
  if (req.body.nextStep !== undefined) {
    application.nextStep = cleanString(req.body.nextStep, 200);
  }
  if (req.body.nextStepDate !== undefined) {
    const date = req.body.nextStepDate
      ? new Date(req.body.nextStepDate)
      : undefined;
    if (req.body.nextStepDate && Number.isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid next step date." });
    }
    application.nextStepDate = date;
  }

  await application.save();
  return res.status(200).json({ application });
});

// Delete an application — owner only.
const deleteApplicationController = asyncHandler(async (req, res) => {
  const result = await jobApplicationModel.deleteOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!result || result.deletedCount === 0) {
    return res.status(404).json({ error: "Application not found." });
  }
  return res.status(204).send();
});

module.exports = {
  createJobController,
  listJobsController,
  getJobController,
  updateJobController,
  deleteJobController,
  createSavedJobController,
  listSavedJobsController,
  deleteSavedJobController,
  createApplicationController,
  listApplicationsController,
  updateApplicationStatusController,
  updateApplicationController,
  deleteApplicationController,
  APPLICATION_STATUSES,
};
