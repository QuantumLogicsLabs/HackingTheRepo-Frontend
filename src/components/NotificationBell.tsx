import React, { useState, useEffect, useRef } from "react";
import { useNotifications } from "../context/NotificationContext";
import "./NotificationBell.css";

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function kindIcon(kind?: string): string {
  switch (kind) {
    case "success": return "\u2713";
    case "error": return "\u2717";
    case "warning": return "\u26A0";
    default: return "\u2139";
  }
}

export default function NotificationBell(): React.ReactElement {
  const { notifications, unreadCount, markRead, markAllRead, clear } = useNotifications();
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // click-outside-to-close
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="notif-bell" ref={bellRef}>
      <button
        className={`bell-btn ${unreadCount > 0 ? "bell-btn--has-unread" : ""}`}
        onClick={() => setOpen((s) => !s)}
        title="Notifications"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V4a1 1 0 1 0-2 0v1.083A6 6 0 0 0 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h11z"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="bell-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="bell-dropdown" role="menu">
          <div className="bell-header">
            <span>Notifications</span>
            <div className="bell-header-actions">
              {unreadCount > 0 && (
                <button className="bell-action" onClick={markAllRead} title="Mark all read">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button className="bell-action bell-action--danger" onClick={clear} title="Clear all">
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="bell-list">
            {notifications.length === 0 && (
              <div className="bell-empty">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3, marginBottom: 8 }}>
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V4a1 1 0 1 0-2 0v1.083A6 6 0 0 0 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h11z"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                No notifications yet
              </div>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`bell-item ${n.read ? "bell-item--read" : "bell-item--unread"}`}
                onClick={() => markRead(n.id)}
              >
                <span className={`bell-item-icon bell-item-icon--${n.kind || "info"}`}>
                  {kindIcon(n.kind)}
                </span>
                <div className="bell-item-content">
                  <div className="bell-item-top">
                    <span className="bell-item-title">{n.title}</span>
                    <span className="bell-item-time">{timeAgo(n.timestamp)}</span>
                  </div>
                  {n.body && <div className="bell-item-body">{n.body}</div>}
                </div>
                {!n.read && <span className="bell-item-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
