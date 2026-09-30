import { useContext } from "react";
import {
  getAllInterviewReports,
  generateInterviewReport,
  getInterviewReportById as fetchInterviewReportById,
  generateResumePdf as fetchResumePdf,
} from "../features/auth/services/interview.api.js";
import { InterviewContext } from "../features/interview.context.jsx";

export const useInterview = () => {
  const context = useContext(InterviewContext);

  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }

  const { loading, setLoading, report, setReport, reports, setReports } =
    context;

  const generateReport = async ({
    jobDescription,
    selfDescription,
    resumeFile,
  }) => {
    setLoading(true);
    let data = null;
    try {
      const response = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile,
      });
      data = response.interviewReport || response;
      setReport(data);
      return data;
    } catch (error) {
      console.error("Failed to generate interview report:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getReportById = async (interviewId) => {
    setLoading(true);
    let data = null;
    try {
      const response = await fetchInterviewReportById(interviewId);
      data = response.interviewReport || response;
      setReport(data);
      return data;
    } catch (error) {
      console.error("Failed to get interview report by ID:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getReports = async () => {
    setLoading(true);
    let data = [];
    try {
      const response = await getAllInterviewReports();
      data = response.interviewReports || response;
      setReports(data);
      return data;
    } catch (error) {
      console.error("Failed to get interview reports:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getResumePdf = async (interviewReportId) => {
    setLoading(true);
    try {
      const blob = await fetchResumePdf({ interviewReportId });
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resume_${interviewReportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download resume PDF:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    setLoading,
    report,
    setReport,
    reports,
    setReports,
    generateReport,
    getReportById,
    getReports,
    getResumePdf,
  };
};

export default useInterview;
