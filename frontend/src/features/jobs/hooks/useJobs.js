import { useState, useCallback } from "react";
import {
  listJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  listSavedJobs,
  saveJob,
  deleteSavedJob,
  listApplications,
  createApplication,
  updateApplicationStatus,
  updateApplication,
  deleteApplication,
} from "../services/jobs.api";

// State management for jobs, saved jobs and applications.
export const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchJobs = useCallback(async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const items = await listJobs(params);
      setJobs(items);
      return items;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJob = useCallback(async (id) => {
    setError("");
    try {
      return await getJob(id);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const addJob = useCallback(async (payload) => {
    setSaving(true);
    setError("");
    try {
      const job = await createJob(payload);
      setJobs((prev) => [job, ...prev]);
      return job;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const editJob = useCallback(async (id, payload) => {
    setSaving(true);
    setError("");
    try {
      const job = await updateJob(id, payload);
      setJobs((prev) => prev.map((j) => (j._id === id ? job : j)));
      return job;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const removeJob = useCallback(async (id) => {
    setError("");
    try {
      await deleteJob(id);
      setJobs((prev) => prev.filter((j) => j._id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const fetchSavedJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await listSavedJobs();
      setSavedJobs(items);
      return items;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addSavedJob = useCallback(async (payload) => {
    setError("");
    try {
      const saved = await saveJob(payload);
      setSavedJobs((prev) => [
        saved,
        ...prev.filter((s) => s._id !== saved._id),
      ]);
      return saved;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const removeSavedJob = useCallback(async (id) => {
    setError("");
    try {
      await deleteSavedJob(id);
      setSavedJobs((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const fetchApplications = useCallback(async (status = "") => {
    setLoading(true);
    setError("");
    try {
      const items = await listApplications(status);
      setApplications(items);
      return items;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addApplication = useCallback(async (payload) => {
    setSaving(true);
    setError("");
    try {
      const application = await createApplication(payload);
      setApplications((prev) => [
        application,
        ...prev.filter((a) => a._id !== application._id),
      ]);
      return application;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const moveApplication = useCallback(async (id, status, note = "") => {
    setError("");
    try {
      const application = await updateApplicationStatus(id, status, note);
      setApplications((prev) =>
        prev.map((a) => (a._id === id ? application : a)),
      );
      return application;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const editApplication = useCallback(async (id, payload) => {
    setSaving(true);
    setError("");
    try {
      const application = await updateApplication(id, payload);
      setApplications((prev) =>
        prev.map((a) => (a._id === id ? application : a)),
      );
      return application;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const removeApplication = useCallback(async (id) => {
    setError("");
    try {
      await deleteApplication(id);
      setApplications((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    jobs,
    savedJobs,
    applications,
    loading,
    saving,
    error,
    setError,
    fetchJobs,
    fetchJob,
    addJob,
    editJob,
    removeJob,
    fetchSavedJobs,
    addSavedJob,
    removeSavedJob,
    fetchApplications,
    addApplication,
    moveApplication,
    editApplication,
    removeApplication,
  };
};
