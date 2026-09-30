import { useContext, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { InterviewContext } from "../interview.context";

// ── Self-contained API layer ──────────────────────────────────────────────
// The four interview API functions live in this file on purpose: useInterview
// is their only consumer, so there is no separate `../services/interview.api`
// module to resolve, misplace, or duplicate. Every endpoint below maps 1:1 to
// the real backend routes (backend/src/routes/interview.route.js, mounted at
// /api/interview in backend/src/app.js).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

function apiError(error, fallback) {
  const message =
    error.response?.data?.error || error.response?.data?.message || fallback;
  throw new Error(message);
}

// POST /api/interview/ — generate a report.
// Resolves to { message, interviewReport }.
async function generateInterviewReport({
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

// GET /api/interview/ — list the current user's reports, newest first.
// Resolves to { message, interviewReports }.
async function getAllInterviewReports() {
  try {
    const { data } = await api.get("/api/interview/");
    return data;
  } catch (error) {
    apiError(error, "Failed to load interview reports.");
  }
}

// GET /api/interview/report/:interviewReportId — single report (owner-scoped).
// Resolves to { message, interviewReport }.
async function getInterviewReportById(interviewReportId) {
  try {
    const { data } = await api.get(
      `/api/interview/report/${interviewReportId}`,
    );
    return data;
  } catch (error) {
    apiError(error, "Failed to load the interview report.");
  }
}

// GET /api/interview/resume/:interviewReportId — resume PDF. Resolves to a Blob.
async function downloadResumePdf(interviewReportId) {
  try {
    const { data } = await api.get(
      `/api/interview/resume/${interviewReportId}`,
      { responseType: "blob" },
    );
    return data;
  } catch (error) {
    apiError(error, "Failed to download the resume PDF.");
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────
export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }

  const { interviewId } = useParams();
  const { loading, setLoading, report, setReport, reports, setReports } =
    context;

  // Generate a new report. Resolves with the created report; throws on failure.
  const generateReport = useCallback(
    async ({ jobDescription, selfDescription, resumeFile }) => {
      setLoading(true);
      try {
        const { interviewReport } = await generateInterviewReport({
          jobDescription,
          selfDescription,
          resumeFile,
        });
        setReport(interviewReport);
        return interviewReport;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setReport],
  );

  const getReportById = useCallback(
    async (id) => {
      setLoading(true);
      try {
        const { interviewReport } = await getInterviewReportById(id);
        setReport(interviewReport);
        return interviewReport;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setReport],
  );

  const getReports = useCallback(async () => {
    setLoading(true);
    try {
      const { interviewReports } = await getAllInterviewReports();
      setReports(interviewReports || []);
      return interviewReports || [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setReports]);

  // Downloads the resume PDF attached to a report via a blob URL.
  const getResumePdf = useCallback(
    async (reportId) => {
      setLoading(true);
      try {
        const blob = await downloadResumePdf(reportId);
        const url = window.URL.createObjectURL(
          new Blob([blob], { type: "application/pdf" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `resume_${reportId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } finally {
        setLoading(false);
      }
    },
    [setLoading],
  );

  // Auto-load the report when the route carries an interview id.
  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId).catch(() => {});
    }
  }, [interviewId, getReportById]);

  return {
    loading,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
    getResumePdf,
  };
};
