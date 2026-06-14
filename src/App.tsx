import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";

const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage").then((module) => ({ default: module.AdminDashboardPage })));
const BrowsePage = lazy(() => import("./pages/BrowsePage").then((module) => ({ default: module.BrowsePage })));
const CategoryPage = lazy(() => import("./pages/CategoryPage").then((module) => ({ default: module.CategoryPage })));
const ContentDetailPage = lazy(() => import("./pages/ContentDetailPage").then((module) => ({ default: module.ContentDetailPage })));
const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage").then((module) => ({ default: module.OnboardingPage })));
const SearchPage = lazy(() => import("./pages/SearchPage").then((module) => ({ default: module.SearchPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));

export default function App() {
  return (
    <Suspense fallback={<main className="center-screen">Loading CopticCloud...</main>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="browse" element={<BrowsePage />} />
            <Route path="category/:categoryId" element={<CategoryPage />} />
            <Route path="content/:contentId" element={<ContentDetailPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute adminOnly />}>
          <Route element={<AppShell />}>
            <Route path="admin" element={<AdminDashboardPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
