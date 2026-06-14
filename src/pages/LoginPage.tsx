import { LogIn } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { CloudLogo } from "../components/CloudLogo";
import { useAuth } from "../state/AuthContext";

export function LoginPage() {
  const { firebaseUser, isConfigured, loading, onboardingRequired, signInWithGoogle } = useAuth();
  const location = useLocation();
  const from = location.state && typeof location.state === "object" && "from" in location.state ? "/" : "/";

  if (!loading && firebaseUser && onboardingRequired) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!loading && firebaseUser && !onboardingRequired) {
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
            <strong>Firebase configuration required</strong>
            <span>
              Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
              VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, and VITE_FIREBASE_APP_ID.
            </span>
          </div>
        ) : null}
        <button className="primary-button auth-button" disabled={!isConfigured || loading} type="button" onClick={signInWithGoogle}>
          <LogIn aria-hidden="true" />
          Continue with Google
        </button>
      </section>
    </main>
  );
}
