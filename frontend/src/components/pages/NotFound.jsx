import { useAuth } from "../../features/auth/hooks/useAuth";
import Button from "../ui/Button";
import "../../style/notfound.scss";

const NotFound = () => {
  const { user } = useAuth();

  return (
    <main className="notfound-page">
      <div className="notfound-card ui-enter">
        <span className="notfound-code" aria-hidden="true">404</span>
        <h1 className="notfound-title">Lost in the nebula</h1>
        <p className="notfound-desc">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <div className="notfound-actions">
          <Button to={user ? "/dashboard" : "/"}>Go home</Button>
          {!user && (
            <Button to="/login" variant="secondary">
              Log in
            </Button>
          )}
        </div>
      </div>
    </main>
  );
};

export default NotFound;
