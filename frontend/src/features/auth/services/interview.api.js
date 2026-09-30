import axios from "axios";

// Same base-URL convention as the auth/ATS API layers.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

function apiError(error, fallback) {
  const message =
    error.response?.data?.error || error.response?.data?.message || fallback;
  throw new Error(message);
}

// Generate an interview preparation report. `resumeFile` is optional;
// the backend also accepts a plain `selfDescription` instead.
// Resolves to { message, interviewReport }.
export async function generateInterviewReport({
  jobDescription,
  selfDescription = "",
  resumeFile,
}) {
  const form = new FormData();
  form.append("jobDescription", jobDescription);
  form.append("selfDescription", selfDescription || "");
  if (resumeFile) form.append("resume", resumeFile);

  try {
    const { data } = await api.post("/api/interview/", form);
    return data;
  } catch (error) {
    apiError(error, "Failed to generate the interview report.");
  }
}

// List all interview reports of the current user, newest first.
// Resolves to { message, interviewReports }.
export async function getAllInterviewReports() {
  try {
    const { data } = await api.get("/api/interview/");
    return data;
  } catch (error) {
    apiError(error, "Failed to load interview reports.");
  }
}

// Fetch a single interview report by id (owner-scoped server-side).
// Resolves to { message, interviewReport }.
export async function getInterviewReportById(interviewReportId) {
  try {
    const { data } = await api.get(
      `/api/interview/report/${interviewReportId}`,
    );
    return data;
  } catch (error) {
    apiError(error, "Failed to load the interview report.");
  }
}

// Download the resume PDF attached to a report. Resolves to a Blob.
export async function downloadResumePdf(interviewReportId) {
  try {
    const { data } = await api.get(
      `/api/interview/resume/${interviewReportId}`,
      {
        responseType: "blob",
      },
    );
    return data;
  } catch (error) {
    apiError(error, "Failed to download the resume PDF.");
  }
}
