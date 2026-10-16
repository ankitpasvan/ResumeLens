const { matchResumeToJob } = require("../services/match.service");
const resumeModel = require("../models/resume.model");
const atsAnalysisModel = require("../models/atsAnalysis.model");
const jobMatchModel = require("../models/jobMatch.model");
const jobApplicationModel = require("../models/jobApplication.model");
const { APPLICATION_STATUSES } = jobApplicationModel;
const interviewReportModel = require("../models/interviewReport.model");
const jobModel = require("../models/job.model");
const savedJobModel = require("../models/savedJob.model");
const asyncHandler = require("../utils/asyncHandler");

// Perf bound on the recommendation candidate pool: scoring is CPU work,
// so the pool is capped before scoring starts.
const RECOMMENDATION_POOL_SIZE = 50;
const DEFAULT_RECOMMENDATION_LIMIT = 10;
const MAX_RECOMMENDATION_LIMIT = 20;

// Mean of `key` over docs, rounded to 1 decimal; 0 when there are none.
function averageScore(docs, key) {
  if (docs.length === 0) return 0;
  const total = docs.reduce((sum, doc) => sum + (doc[key] || 0), 0);
  return Math.round((total / docs.length) * 10) / 10;
}

// The user's primary resume, falling back to the newest one.
async function resolvePrimaryResume(userId) {
  return (
    (await resumeModel.findOne({ user: userId, isPrimary: true })) ||
    (await resumeModel.findOne({ user: userId }).sort({ createdAt: -1 }))
  );
}

// Aggregate statistics for the authenticated user's dashboard.
// GET /api/dashboard/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [
    resumeCount,
    analyses,
    matches,
    applications,
    interviewCount,
    jobsPostedCount,
  ] = await Promise.all([
    resumeModel.countDocuments({ user: userId }),
    atsAnalysisModel
      .find({ user: userId })
      .select("score createdAt")
      .sort({ createdAt: -1 })
      .lean(),
    jobMatchModel
      .find({ user: userId })
      .select("matchScore jobTitle createdAt")
      .sort({ matchScore: -1 })
      .lean(),
    jobApplicationModel.find({ user: userId }).select("status").lean(),
    interviewReportModel.countDocuments({ user: userId }),
    jobModel.countDocuments({ user: userId }),
  ]);

  // Every application status is present, even when its count is 0.
  const byStatus = {};
  for (const status of APPLICATION_STATUSES) {
    byStatus[status] = 0;
  }
  for (const application of applications) {
    if (byStatus[application.status] === undefined) {
      byStatus[application.status] = 0;
    }
    byStatus[application.status] += 1;
  }

  const bestMatch = matches.length > 0 ? matches[0] : null;

  res.status(200).json({
    resumes: { total: resumeCount },
    analyses: {
      total: analyses.length,
      avgScore: averageScore(analyses, "score"),
      recent: analyses.slice(0, 5).map((analysis) => ({
        id: analysis._id,
        score: analysis.score,
        createdAt: analysis.createdAt,
      })),
    },
    matches: {
      total: matches.length,
      avgScore: averageScore(matches, "matchScore"),
      best: bestMatch
        ? {
            id: bestMatch._id,
            score: bestMatch.matchScore,
            jobTitle: bestMatch.jobTitle,
          }
        : null,
    },
    applications: {
      total: applications.length,
      byStatus,
    },
    interviews: { total: interviewCount },
    jobsPosted: { total: jobsPostedCount },
  });
});

// Deterministic job recommendations for the authenticated user.
// Open jobs (not posted by the user, not already saved or applied to)
// are scored against the user's primary resume with the deterministic
// matcher. No AI calls are made here, so this endpoint never consumes
// AI quota.
// GET /api/dashboard/recommendations?limit=10
const getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const parsedLimit = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), MAX_RECOMMENDATION_LIMIT)
    : DEFAULT_RECOMMENDATION_LIMIT;

  const resume = await resolvePrimaryResume(userId);
  if (!resume) {
    return res
      .status(404)
      .json({ error: "Upload a resume first to get recommendations." });
  }
  const resumeText = resume.parsedText || "";

  // Candidate pool: open jobs from other users, newest first, bounded.
  const jobs = await jobModel
    .find({ status: "open", user: { $ne: userId } })
    .sort({ createdAt: -1 })
    .limit(RECOMMENDATION_POOL_SIZE)
    .lean();

  // Exclude jobs the user already saved or applied to (board postings
  // carry the `job` reference; ad-hoc snapshots have none to exclude).
  const [savedJobs, applications] = await Promise.all([
    savedJobModel
      .find({ user: userId, job: { $ne: null } })
      .select("job")
      .lean(),
    jobApplicationModel
      .find({ user: userId, job: { $ne: null } })
      .select("job")
      .lean(),
  ]);
  const excludedJobIds = new Set(
    [...savedJobs, ...applications].map((doc) => String(doc.job)),
  );

  const scored = [];
  for (const job of jobs) {
    if (excludedJobIds.has(String(job._id))) continue;
    const jobDescription = job.description || "";
    // A job with no description has nothing to score against — skip it
    // rather than returning a meaningless zero.
    if (!jobDescription.trim()) continue;
    // matchResumeToJob is deterministic and never throws on plain
    // strings, but one malformed job must not fail the whole request.
    try {
      const result = matchResumeToJob(
        resumeText,
        job.title || "",
        jobDescription,
      );
      scored.push({
        jobId: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        jobType: job.jobType,
        matchScore: result.score,
        matchedSkills: (result.matchedSkills || []).slice(0, 5),
        missingSkills: (result.missingSkills || []).slice(0, 5),
      });
    } catch {
      continue;
    }
  }

  scored.sort((a, b) => b.matchScore - a.matchScore);

  res.status(200).json({ recommendations: scored.slice(0, limit) });
});

module.exports = {
  getDashboardStats,
  getRecommendations,
};
