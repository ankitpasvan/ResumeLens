import axios from "axios";

// Base URL is configurable via frontend/.env (VITE_API_URL). Falls back to
// the local backend default so existing setups keep working.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

// The backend sends errors as `{ error: "..." }` (and occasionally
// `{ message: "..." }`). Normalize both so pages can show real messages.
function apiError(error, fallback) {
  const message =
    error.response?.data?.error || error.response?.data?.message || fallback;
  throw new Error(message);
}

// Register a new user. Resolves to { message, user }.
export async function register({ username, email, password }) {
  try {
    const { data } = await api.post("/api/auth/register", {
      username,
      email,
      password,
    });
    return data;
  } catch (error) {
    apiError(error, "Registration failed");
  }
}

// Login an existing user. Resolves to { message, user }.
export async function login({ email, password }) {
  try {
    const { data } = await api.post("/api/auth/login", { email, password });
    return data;
  } catch (error) {
    apiError(error, "Login failed");
  }
}

// Logout the current user (revokes the session server-side).
export async function logout() {
  try {
    const { data } = await api.post("/api/auth/logout", {});
    return data;
  } catch (error) {
    apiError(error, "Logout failed");
  }
}

// Fetch the currently authenticated user. Resolves to { success, user }.
// Throws (401) when there is no valid session — callers treat that as
// "not logged in".
export async function getUser() {
  try {
    const { data } = await api.get("/api/auth/getuser");
    return data;
  } catch (error) {
    apiError(error, "Failed to get user");
  }
}
