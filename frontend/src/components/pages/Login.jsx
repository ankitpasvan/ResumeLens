import { useState } from "react";
import "./auth.form.scss";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import GoogleButton from "../auth/GoogleButton";


const Login = () => {
  const navigate = useNavigate();
  const { loading, handleLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await handleLogin(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="auth-page">
        <h1>Loading...</h1>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <Link to="/" className="auth-brand" aria-label="ResumeLens home">
        <span aria-hidden="true">◈</span> ResumeLens
      </Link>
      <div className="form-container">
        <h1>Welcome back</h1>
        <p className="auth-sub">Log in to your career command center.</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              required
            />
          </div>
          {error && (
            <p className="auth-error" role="alert">{error}</p>
          )}
          <button
            className="button button-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="auth-divider">
  <span>or</span>
</div>
<GoogleButton />
<p>
  Don&apos;t have an account? <Link to="/register">Register</Link>
</p>

      </div>
    </main>
  );
};

export default Login;
