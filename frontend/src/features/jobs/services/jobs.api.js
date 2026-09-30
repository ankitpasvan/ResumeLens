import axios from "axios";

// Shared API client for jobs, saved jobs and applications. Used by the
// useJobs hook and by the JobMatch page (for the "save job" button).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

function apiError(error, fallback) {
  const message =
    error.response?.data?.error || error.response?.data?.message || fallback;
  throw new Error(message);
}

// --- Jobs (shared board) ---

export async function listJobs(params = {}) {
  try {
    const { data } = await api.get("/api/jobs", { params });
    return data.jobs || [];
  } catch (error) {
    apiError(error, "Failed to load jobs.");
  }
}

export async function getJob(id) {
  try {
    const { data } = await api.get(`/api/jobs/${id}`);
    return data.job;
  } catch (error) {
    apiError(error, "Failed to load the job.");
  }
}

export async function createJob(payload) {
  try {
    const { data } = await api.post("/api/jobs", payload);
    return data.job;
  } catch (error) {
    apiError(error, "Could not create the job. Please try again.");
  }
}

export async function updateJob(id, payload) {
  try {
    const { data } = await api.patch(`/api/jobs/${id}`, payload);
    return data.job;
  } catch (error) {
    apiError(error, "Could not update the job. Please try again.");
  }
}

export async function deleteJob(id) {
  try {
    await api.delete(`/api/jobs/${id}`);
  } catch (error) {
    apiError(error, "Could not delete the job. Please try again.");
  }
}

// --- Saved jobs ---

export async function listSavedJobs() {
  try {
    const { data } = await api.get("/api/saved-jobs");
    return data.savedJobs || [];
  } catch (error) {
    apiError(error, "Failed to load saved jobs.");
  }
}

// Save a board posting ({ jobId }) or an ad-hoc listing
// ({ jobTitle, company?, description?, matchId?, notes? }).
export async function saveJob(payload) {
  try {
    const { data } = await api.post("/api/saved-jobs", payload);
    return data.savedJob;
  } catch (error) {
    apiError(error, "Could not save the job. Please try again.");
  }
}

export async function deleteSavedJob(id) {
  try {
    await api.delete(`/api/saved-jobs/${id}`);
  } catch (error) {
    apiError(error, "Could not remove the saved job.");
  }
}

// --- Applications ---

export async function listApplications(status = "") {
  try {
    const { data } = await api.get("/api/applications", {
      params: status ? { status } : {},
    });
    return data.applications || [];
  } catch (error) {
    apiError(error, "Failed to load applications.");
  }
}

// Start tracking: { savedJobId?, jobId?, jobTitle?, company?,
// description?, matchScore?, status? ("saved" | "applied"), notes? }.
export async function createApplication(payload) {
  try {
    const { data } = await api.post("/api/applications", payload);
    return data.application;
  } catch (error) {
    apiError(error, "Could not create the application. Please try again.");
  }
}

export async function updateApplicationStatus(id, status, note = "") {
  try {
    const { data } = await api.patch(`/api/applications/${id}`, {
      status,
      note,
    });
    return data.application;
  } catch (error) {
    apiError(error, "Could not update the application status.");
  }
}

export async function updateApplication(id, payload) {
  try {
    const { data } = await api.put(`/api/applications/${id}`, payload);
    return data.application;
  } catch (error) {
    apiError(error, "Could not update the application.");
  }
}

export async function deleteApplication(id) {
  try {
    await api.delete(`/api/applications/${id}`);
  } catch (error) {
    apiError(error, "Could not delete the application.");
  }
}

export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "assessment",
  "interview",
  "offer",
  "rejected",
];
