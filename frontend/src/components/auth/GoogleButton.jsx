import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";

// Client ID is read once at module render time, not inside the effect,
// so we never call setState synchronously within an effect.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Loads the Google Identity Services script once, returns a promise.
function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google sign-in"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in"));
    document.head.appendChild(script);
  });
}

const GoogleButton = () => {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { handleGoogleLogin } = useAuth();
  const [error, setError] = useState(
    GOOGLE_CLIENT_ID ? "" : "Google login is not configured."
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;

    const handleCredential = async (response) => {
      // User closed the popup without signing in — not an error.
      if (cancelled || !response?.credential) return;
      setError("");
      setBusy(true);
      try {
        await handleGoogleLogin(response.credential);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        setError(err.message || "Google login failed. Please try again.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    };

    loadGisScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredential,
          // Don't auto-prompt; only show on button click.
          auto_select: false,
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "signin_with",
          shape: "rectangular",
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [handleGoogleLogin, navigate]);

  return (
    <div className="google-login-wrap">
      <div ref={buttonRef} aria-label="Sign in with Google" />
      {busy && <p className="muted small">Signing you in…</p>}
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default GoogleButton;
