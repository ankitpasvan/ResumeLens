import { useState, useCallback } from "react";
import axios from "axios";

// The API client lives in this file (not in a separate services file)
// so there is exactly one file to keep in sync — its only consumer is
// this hook. It talks to the real backend matching endpoints.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

function apiError(error, fallback) {
  const message =
    error.response?.data?.error || error.response?.data?.message || fallback;
  throw new Error(message);
}

// Match a stored resume against a job posting. `resumeId` is optional —
// without it the backend uses the primary resume (falling back to newest).
// Resolves to the created match.
async function createMatch({ resumeId, jobTitle, jobDescription }) {
  try {
    const { data } = await api.post("/api/matches", {
      ...(resumeId ? { resumeId } : {}),
      jobTitle: jobTitle.trim(),
      jobDescription: jobDescription.trim(),
    });
    return data.match;
  } catch (error) {
    apiError(error, "Could not run the job match. Please try again.");
  }
}

// List the user's past matches, newest first (job description excluded).
// Resolves to the matches array.
async function listMatches() {
  try {
    const { data } = await api.get("/api/matches");
    return data.matches || [];
  } catch (error) {
    apiError(error, "Failed to load match history.");
  }
}

// Fetch a single match with its full job description (owner-scoped).
async function getMatch(id) {
  try {
    const { data } = await api.get(`/api/matches/${id}`);
    return data.match;
  } catch (error) {
    apiError(error, "Failed to load the match.");
  }
}

export const useMatching = () => {
  const [matches, setMatches] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await listMatches();
      setMatches(items);
      return items;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Run a new match. Resolves to the created match and prepends it
  // to the history (without the full job description, like the API).
  const runMatch = useCallback(
    async ({ resumeId, jobTitle, jobDescription }) => {
      setRunning(true);
      setError("");
      try {
        const match = await createMatch({ resumeId, jobTitle, jobDescription });
        setCurrent(match);
        setMatches((prev) => {
          const listed = { ...match };
          delete listed.jobDescription;
          return [listed, ...prev.filter((m) => m._id !== match._id)];
        });
        return match;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setRunning(false);
      }
    },
    [],
  );

  // Load one match in full (for the history detail view).
  const fetchMatch = useCallback(async (id) => {
    setLoading(true);
    setError("");
    try {
      const match = await getMatch(id);
      setCurrent(match);
      return match;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCurrent = useCallback(() => setCurrent(null), []);

  return {
    matches,
    current,
    loading,
    running,
    error,
    setError,
    fetchMatches,
    runMatch,
    fetchMatch,
    clearCurrent,
  };
};
