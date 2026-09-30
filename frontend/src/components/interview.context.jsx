/* eslint-disable react-refresh/only-export-components -- colocated InterviewContext + InterviewProvider is the established pattern in this codebase */
import { createContext, useMemo, useState } from "react";

export const InterviewContext = createContext(null);

export const InterviewProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);

  const value = useMemo(
    () => ({
      loading,
      setLoading,
      report,
      setReport,
      reports,
      setReports,
    }),
    [loading, report, reports],
  );

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
};
