/**
 * Routes: public landing + auth; private app shell uses a pathless layout route
 * so `/` stays the marketing page and `/dashboard`, `/jobs/*`, `/settings` stay nested.
 */
import type { ReactElement } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import AuthLoadingScreen from "./components/AuthLoadingScreen";
import Layout from "./components/Layout";
import LandingPage from "./views/LandingPage";
import LoginPage from "./views/LoginPage";
import SignupPage from "./views/SignupPage";
import { GithubCallbackPage } from "./views/AuthPages";
import DashboardPage from "./views/DashboardPage";
import NewJobPage from "./views/NewJobPage";
import JobDetailPage from "./views/JobDetailPage";
import SettingsPage from "./views/SettingsPage";
import AnalyticsPage from "./views/AnalyticsPage";

interface RouteWrapperProps {
  children: ReactElement;
}

function PrivateRoute({ children }: RouteWrapperProps): ReactElement {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
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
                path="/auth/github/callback"
                element={<GithubCallbackPage />}
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
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="jobs/new" element={<NewJobPage />} />
                <Route path="jobs/:id" element={<JobDetailPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
