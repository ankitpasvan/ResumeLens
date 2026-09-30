import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";

// Route guard: renders children only for authenticated users, otherwise
// redirects to /login. Note the destructured `{ children }` — receiving the
// raw props object here would crash React ("Objects are not valid as a
// React child").
const Protected = ({ children }) => {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <main
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <h1>Loading...</h1>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default Protected;
