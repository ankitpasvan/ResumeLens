import { api, apiError } from "../../../lib/api";

// Dashboard data from the real backend endpoints (all auth-required,
// owner-scoped). No AI calls — these do not consume AI quota.

// GET /api/dashboard/stats — aggregate counts for the authenticated user.
// Resolves to { resumes, analyses, matches, applications, interviews, jobsPosted }.
export async function getDashboardStats() {
  try {
    const { data } = await api.get("/api/dashboard/stats");
    return data;
  } catch (error) {
    apiError(error, "Failed to load dashboard statistics");
  }
}

// GET /api/dashboard/recommendations?limit=N — deterministic job
// recommendations scored against the user's primary resume.
// Resolves to an array of { jobId, title, company, location, jobType,
// matchScore, matchedSkills[], missingSkills[] }.
export async function getRecommendations(limit = 6) {
  try {
    const { data } = await api.get("/api/dashboard/recommendations", {
      params: { limit },
    });
    return data.recommendations || [];
  } catch (error) {
    apiError(error, "Failed to load job recommendations");
  }
}
