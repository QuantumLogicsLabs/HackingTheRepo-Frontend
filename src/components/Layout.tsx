import type { MouseEventHandler, ReactElement, SVGProps } from "react";
import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  useNotifications,
  type NotificationItem,
} from "../context/NotificationContext";
import ThemeToggle from "./ThemeToggle";
import "./Layout.css";

interface NavLinkState {
  isActive: boolean;
}

type IconProps = SVGProps<SVGSVGElement>;

const GitIcon = (props: IconProps): ReactElement => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

export default function Layout(): ReactElement {
  const { user, logout } = useAuth();
  const {
    notifications,
    toast,
    dropdownOpen,
    setDropdownOpen,
    markAllRead,
    dismissToast,
  } = useNotifications();
  const navigate = useNavigate();
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);

  const getNavItemClassName = ({ isActive }: NavLinkState): string =>
    `nav-item ${isActive ? "active" : ""}`;

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;
  const latestNotifications = notifications.slice(0, 5);
  const bellTitle = unreadCount
    ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
    : "No new notifications";

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      dismissToast();
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [toast, dismissToast]);

  useEffect(() => {
    const isShortcutTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(
        target.closest(
          "input, textarea, select, button, [contenteditable='true'], [contenteditable='']",
        ) || target.isContentEditable,
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const key = event.key;
      if (isShortcutTarget(event.target)) return;

      if (
        key.toLowerCase() === "n" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
      ) {
        navigate("/jobs/new");
        event.preventDefault();
      }

      if (
        key.toLowerCase() === "d" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
      ) {
        navigate("/dashboard");
        event.preventDefault();
      }

      if (key === "?" && !event.ctrlKey && !event.altKey && !event.metaKey) {
        setCheatsheetOpen((open) => !open);
        event.preventDefault();
      }

      if (key === "Escape" && cheatsheetOpen) {
        setCheatsheetOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, cheatsheetOpen]);

  const handleLogout: MouseEventHandler<HTMLButtonElement> = () => {
    logout();
    navigate("/");
  };

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
          <NavLink to="/dashboard" className={getNavItemClassName}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </NavLink>
          <NavLink to="/jobs/new" className={getNavItemClassName}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            New Job
          </NavLink>
          <NavLink to="/analytics" className={getNavItemClassName}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 3v18h18" />
              <path d="M7 13v6" />
              <path d="M12 9v10" />
              <path d="M17 5v14" />
            </svg>
            Analytics
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin/users" className={getNavItemClassName}>
              <GitIcon />
              Users
            </NavLink>
          )}
          <NavLink to="/settings" className={getNavItemClassName}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </NavLink>
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
            <button
              onClick={handleLogout}
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
        <div className="layout-topbar">
          <div className="layout-topbar-title">
            <span>Real-time notifications</span>
            <small>
              Toast alerts and bell dropdown when jobs complete, fail, or need
              review.
            </small>
            <div className="hotkey-strip">
              <button
                type="button"
                className="hotkey-help-btn"
                onClick={() => setCheatsheetOpen(true)}
              >
                <span className="hotkey-pill">?</span> Help
              </button>
            </div>
          </div>
          <div className="notification-zone">
            <button
              type="button"
              className="bell-button"
              aria-label={bellTitle}
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                if (!dropdownOpen) markAllRead();
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="bell-badge">{unreadCount}</span>
              )}
              🔔
            </button>
            {dropdownOpen && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <span>Notifications</span>
                  <button
                    type="button"
                    className="notification-clear"
                    onClick={markAllRead}
                  >
                    Mark all read
                  </button>
                </div>
                {latestNotifications.length === 0 ? (
                  <div className="notification-empty">You're all caught up</div>
                ) : (
                  latestNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item ${notification.type}`}
                    >
                      <div className="notification-item-title">
                        {notification.title}
                      </div>
                      <div className="notification-item-text">
                        {notification.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <Outlet />
        {cheatsheetOpen && (
          <div
            className="cheatsheet-backdrop"
            onClick={() => setCheatsheetOpen(false)}
          >
            <div
              className="cheatsheet-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cheatsheet-title"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="cheatsheet-card-close"
                onClick={() => setCheatsheetOpen(false)}
                aria-label="Close keyboard shortcuts cheatsheet"
              >
                ×
              </button>
              <h2 id="cheatsheet-title">Keyboard shortcuts</h2>
              <p>Power-user hotkeys for faster navigation across the app.</p>
              <div className="cheatsheet-list">
                <div className="cheatsheet-item">
                  <span className="cheatsheet-key">N</span>
                  <div>
                    <div className="cheatsheet-item-title">New Job</div>
                    <div className="cheatsheet-item-subtitle">
                      Open the job creation page.
                    </div>
                  </div>
                </div>
                <div className="cheatsheet-item">
                  <span className="cheatsheet-key">D</span>
                  <div>
                    <div className="cheatsheet-item-title">Dashboard</div>
                    <div className="cheatsheet-item-subtitle">
                      Jump to the dashboard overview.
                    </div>
                  </div>
                </div>
                <div className="cheatsheet-item">
                  <span className="cheatsheet-key">?</span>
                  <div>
                    <div className="cheatsheet-item-title">Help</div>
                    <div className="cheatsheet-item-subtitle">
                      Show or hide this cheatsheet.
                    </div>
                  </div>
                </div>
                <div className="cheatsheet-item">
                  <span className="cheatsheet-key">Esc</span>
                  <div>
                    <div className="cheatsheet-item-title">Close</div>
                    <div className="cheatsheet-item-subtitle">
                      Dismiss the cheatsheet overlay.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            <div className="toast-content">
              <strong>{toast.title}</strong>
              <p>{toast.message}</p>
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={dismissToast}
            >
              ×
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
