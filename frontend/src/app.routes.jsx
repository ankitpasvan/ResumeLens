import { createBrowserRouter } from "react-router-dom";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import NotFound from "./components/pages/NotFound";
import Home from "./components/pages/Home";
import Interview from "./components/pages/interview";
import Protected from "./components/Protected";
import { InterviewProvider } from "./components/interview.context";
import AtsAnalyzer from "./components/pages/AtsAnalyzer";
import AtsHistory from "./components/pages/AtsHistory";
import AtsDetail from "./components/pages/AtsDetail";
import Resumes from "./components/pages/Resumes";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: (
      <Protected>
        <InterviewProvider>
          <Home />
        </InterviewProvider>
      </Protected>
    ),
  },
  {
    path: "/interview/:interviewId",
    element: (
      <Protected>
        <InterviewProvider>
          <Interview />
        </InterviewProvider>
      </Protected>
    ),
  },
  {
    path: "/ats",
    element: (
      <Protected>
        <AtsAnalyzer />
      </Protected>
    ),
  },
  {
    path: "/ats/history",
    element: (
      <Protected>
        <AtsHistory />
      </Protected>
    ),
  },
  {
    path: "/ats/:id",
    element: (
      <Protected>
        <AtsDetail />
      </Protected>
    ),
  },
  {
    path: "/resumes",
    element: (
      <Protected>
        <Resumes />
      </Protected>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
