"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AuthLoadingScreen from "@/components/AuthLoadingScreen";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import Toasts from "@/components/Toast";
import "@/components/Layout.css";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18" />
        <path d="M7 13v6" />
        <path d="M12 9v10" />
        <path d="M17 5v14" />
      </svg>
    ),
  },
  {
    href: "/jobs/new",
    label: "New Job",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function AuthenticatedLayout({ children }: { children: ReactElement }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key.toLowerCase() === "n") {
        router.push("/jobs/new");
      }

      if (e.key.toLowerCase() === "d") {
        router.push("/dashboard");
      }

      if (e.key === "?") {
        setShowShortcuts((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  if (loading) return <AuthLoadingScreen />;
  if (!user) return null;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="logo-text">RepoMind</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)) ? "active" : ""}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="user-meta">
              <div className="user-name">{user?.username}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <div className="sidebar-actions">
            <ThemeToggle className="theme-toggle--sidebar" />
            <NotificationBell />
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="logout-btn"
              title="Logout"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Toasts />

        {showShortcuts && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "#ffffff",
              color: "#111111",
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              padding: "16px",
              zIndex: 1000,
              minWidth: "220px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Keyboard Shortcuts</h3>
            <p><strong>N</strong> → New Job</p>
            <p><strong>D</strong> → Dashboard</p>
            <p><strong>?</strong> → Help</p>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
