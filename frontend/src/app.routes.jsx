import { createBrowserRouter } from "react-router-dom";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import NotFound from "./components/pages/NotFound";
import Home from "./components/pages/Home";
import Interview from "./components/pages/interview";

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
    path:"/",
    element: <protected><Home /></protected>
  },
  {
    path:"/interview/:interviewId",
    element: <protected><Interview /></protected>,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
