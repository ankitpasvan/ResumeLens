import axios from "axios";

// Same base-URL convention as the auth API layer.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

function apiError(error, fallback) {
  const message =
    error.response?.data?.error || error.response?.data?.message || fallback;
  throw new Error(message);
}

// Run an ATS analysis. Provide either a PDF `resumeFile` (sent as
// multipart, field name `resume`) or plain `resumeText`. `jobDescription`
// is optional — without it the keyword component is skipped server-side.
// Resolves to { message, analysis }.
export async function analyzeAts({
  resumeFile,
  resumeText = "",
  jobDescription = "",
}) {
  try {
    let data;
    if (resumeFile) {
      const form = new FormData();
      form.append("resume", resumeFile);
      if (jobDescription.trim())
        form.append("jobDescription", jobDescription.trim());
      if (resumeText.trim()) form.append("resumeText", resumeText.trim());
      ({ data } = await api.post("/api/ats/analyze", form));
    } else {
      ({ data } = await api.post("/api/ats/analyze", {
        resumeText: resumeText.trim(),
        jobDescription: jobDescription.trim(),
      }));
    }
    return data;
  } catch (error) {
    apiError(error, "ATS analysis failed. Please try again.");
  }
}

// List the current user's past analyses, newest first.
// Resolves to the analyses array.
export async function listAtsAnalyses() {
  try {
    const { data } = await api.get("/api/ats");
    return data.analyses || [];
  } catch (error) {
    apiError(error, "Failed to load ATS history.");
  }
}

// Fetch a single analysis by id (owner-scoped server-side).
// Resolves to the analysis object.
export async function getAtsAnalysis(id) {
  try {
    const { data } = await api.get(`/api/ats/${id}`);
    return data.analysis;
  } catch (error) {
    apiError(error, "Failed to load the ATS analysis.");
  }
}
