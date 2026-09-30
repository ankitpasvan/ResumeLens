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

// Upload a resume PDF (multipart, field name `resume`). `name` is optional —
// the backend falls back to the file name. Resolves to the created resume.
export async function uploadResume({ name = "", resumeFile }) {
  const form = new FormData();
  form.append("resume", resumeFile);
  if (name.trim()) form.append("name", name.trim());

  try {
    const { data } = await api.post("/api/resumes/upload", form);
    return data.resume;
  } catch (error) {
    apiError(error, "Resume upload failed. Please try again.");
  }
}

// Save a resume from pasted text. Resolves to the created resume.
export async function createResume({ name, resumeText }) {
  try {
    const { data } = await api.post("/api/resumes", {
      name: name.trim(),
      resumeText: resumeText.trim(),
    });
    return data.resume;
  } catch (error) {
    apiError(error, "Could not save the resume. Please try again.");
  }
}

// List the user's resumes, newest first (parsed text excluded).
// Resolves to the resumes array.
export async function listResumes() {
  try {
    const { data } = await api.get("/api/resumes");
    return data.resumes || [];
  } catch (error) {
    apiError(error, "Failed to load resumes.");
  }
}

// Fetch a single resume with its full parsed text (owner-scoped server-side).
export async function getResume(id) {
  try {
    const { data } = await api.get(`/api/resumes/${id}`);
    return data.resume;
  } catch (error) {
    apiError(error, "Failed to load the resume.");
  }
}

// Fetch the primary resume. Returns null (not an error) when the user has
// no resumes yet.
export async function getPrimaryResume() {
  try {
    const { data } = await api.get("/api/resumes/primary");
    return data.resume;
  } catch (error) {
    if (error.response?.status === 404) return null;
    apiError(error, "Failed to load the primary resume.");
  }
}

// Mark a resume as the primary one. Resolves to the updated resume.
export async function setPrimaryResume(id) {
  try {
    const { data } = await api.patch(`/api/resumes/${id}/primary`);
    return data.resume;
  } catch (error) {
    apiError(error, "Could not set the primary resume.");
  }
}

// Delete a resume.
export async function deleteResume(id) {
  try {
    await api.delete(`/api/resumes/${id}`);
  } catch (error) {
    apiError(error, "Could not delete the resume.");
  }
}
