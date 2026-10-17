import axios from "axios";

// Shared Axios instance for all ResumeLens API calls.
// Base URL is configurable via frontend/.env (VITE_API_URL). Falls back to
// the local backend default so existing setups keep working.
// `withCredentials: true` sends the httpOnly `token` session cookie on
// every request (required for all authenticated endpoints).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

// The backend sends errors as `{ error: "..." }` (and occasionally
// `{ message: "..." }`). Normalize both so pages can show real messages
// instead of a generic fallback.
export function apiError(error, fallback) {
  const message =
    error.response?.data?.error || error.response?.data?.message || fallback;
  throw new Error(message);
}
