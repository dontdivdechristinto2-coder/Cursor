import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { isAuthenticated, loading, onboardingRequired, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return <main className="center-screen">Loading CopticCloud...</main>;
  }

  if (onboardingRequired) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (adminOnly && profile?.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
