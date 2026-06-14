import { LogIn } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { CloudLogo } from "../components/CloudLogo";
import { useAuth } from "../state/AuthContext";

export function LoginPage() {
  const { isAuthenticated, isConfigured, loading, onboardingRequired, signInWithGoogle, startLocalOnboarding } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state && typeof location.state === "object" && "from" in location.state ? "/" : "/";

  if (!loading && onboardingRequired) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!loading && isAuthenticated && !onboardingRequired) {
    return <Navigate to={from} replace />;
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <CloudLogo />
        <p className="eyebrow">Coptic Orthodox Digital Library</p>
        <h1>CopticCloud</h1>
        <p>
          A reverent, mobile-first platform for liturgical texts, hymnology, readings, media, and education.
        </p>
        {!isConfigured ? (
          <div className="config-warning">
            <strong>No Google setup required</strong>
            <span>
              CopticCloud will run locally in this browser. You can set up Firebase later if you want cloud sync.
            </span>
          </div>
        ) : null}
        <button
          className="primary-button auth-button"
          disabled={loading}
          type="button"
          onClick={() => {
            if (isConfigured) {
              void signInWithGoogle();
              return;
            }

            startLocalOnboarding();
            navigate("/onboarding");
          }}
        >
          <LogIn aria-hidden="true" />
          {isConfigured ? "Continue with Google" : "Continue without Google"}
        </button>
      </section>
    </main>
  );
}
