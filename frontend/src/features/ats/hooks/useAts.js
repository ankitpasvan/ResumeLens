import { useState, useCallback } from "react";
import {
  analyzeAts,
  listAtsAnalyses,
  getAtsAnalysis,
} from "../services/ats.api.js";

export const useAts = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  // Runs a new analysis. `input` = { resumeFile?, resumeText?, jobDescription? }.
  // Resolves with the analysis and stores it in state; throws on failure.
  const analyze = useCallback(async (input) => {
    setAnalyzing(true);
    setError("");
    try {
      const { analysis: result } = await analyzeAts(input);
      setAnalysis(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await listAtsAnalyses();
      setAnalyses(items);
      return items;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchById = useCallback(async (id) => {
    setLoading(true);
    setError("");
    try {
      const item = await getAtsAnalysis(id);
      setAnalysis(item);
      return item;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analyzing,
    loading,
    analyses,
    analysis,
    error,
    analyze,
    fetchHistory,
    fetchById,
    setAnalysis,
    setError,
  };
};
