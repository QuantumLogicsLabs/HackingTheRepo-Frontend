/**
 * Routes: public landing + auth; private app shell uses a pathless layout route
 * so `/` stays the marketing page and `/dashboard`, `/jobs/*`, `/settings` stay nested.
 */
import type { ReactElement } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import NewJobPage from "./pages/NewJobPage";
import JobDetailPage from "./pages/JobDetailPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import GithubCallback from "./pages/GithubCallback";

interface RouteWrapperProps {
  children: ReactElement;
}

/** Full-viewport loading shell — matches luxury theme, avoids blank flashes on public routes */
function AuthLoadingScreen(): ReactElement {
  return (
    <div
      className="app-auth-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="app-auth-loading__inner">
        <span className="spinner" aria-hidden="true" />
        <span className="app-auth-loading__text">Loading…</span>
      </div>
    </div>
  );
}

function PrivateRoute({ children }: RouteWrapperProps): ReactElement {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: RouteWrapperProps): ReactElement {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  return user?.role === "admin" ? (
    children
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

function PublicRoute({ children }: RouteWrapperProps): ReactElement {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App(): ReactElement {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <LandingPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicRoute>
                    <SignupPage />
                  </PublicRoute>
                }
              />
              {/* Pathless layout: React Router v6 matches child paths (/dashboard, /jobs/...) without competing with `/` */}
              <Route
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="jobs/new" element={<NewJobPage />} />
                <Route path="jobs/:id" element={<JobDetailPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route
                  path="admin/users"
                  element={
                    <AdminRoute>
                      <AdminUsersPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="auth/github/callback"
                  element={<GithubCallback />}
                />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
