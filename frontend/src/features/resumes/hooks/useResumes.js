import { useState, useCallback } from "react";
import {
  uploadResume,
  createResume,
  listResumes,
  getResume,
  setPrimaryResume,
  deleteResume,
} from "../services/resume.api.js";

export const useResumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await listResumes();
      setResumes(items);
      return items;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Save a new resume from an uploaded PDF or pasted text.
  // `input` = { name, resumeFile? } | { name, resumeText }.
  const saveResume = useCallback(async (input) => {
    setSaving(true);
    setError("");
    try {
      const created = input.resumeFile
        ? await uploadResume(input)
        : await createResume(input);
      setResumes((prev) => {
        const next = [created, ...prev.filter((r) => r._id !== created._id)];
        // If the new resume became primary, clear the flag on the rest.
        return created.isPrimary
          ? next.map((r) =>
              r._id === created._id ? r : { ...r, isPrimary: false },
            )
          : next;
      });
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const makePrimary = useCallback(async (id) => {
    setError("");
    try {
      const updated = await setPrimaryResume(id);
      setResumes((prev) =>
        prev.map((r) => ({ ...r, isPrimary: r._id === updated._id })),
      );
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const removeResume = useCallback(
    async (id) => {
      setError("");
      try {
        await deleteResume(id);
        // Deleting the primary promotes the newest remaining resume
        // server-side; refresh to pick up the authoritative flags.
        await fetchResumes();
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [fetchResumes],
  );

  // Fetch full parsed text for one resume (the list omits it).
  const fetchResumeText = useCallback(async (id) => {
    setError("");
    try {
      const resume = await getResume(id);
      return resume.parsedText || "";
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    resumes,
    loading,
    saving,
    error,
    setError,
    fetchResumes,
    saveResume,
    makePrimary,
    removeResume,
    fetchResumeText,
  };
};
