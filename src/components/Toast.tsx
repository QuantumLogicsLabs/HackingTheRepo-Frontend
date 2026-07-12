import React from "react";
import { useNotifications } from "../context/NotificationContext";
import "./Toast.css";

export default function Toasts(): React.ReactElement | null {
  const { notifications, markRead } = useNotifications();

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="toast-wrap" aria-live="polite">
      {notifications.slice(0, 4).map((n) => (
        <div key={n.id} className={`toast toast-${n.kind || "info"} ${n.read ? "toast-read" : ""}`}>
          <div className="toast-body">
            <div className="toast-title">{n.title}</div>
            {n.body && <div className="toast-text">{n.body}</div>}
          </div>
          <button className="toast-close" onClick={() => markRead(n.id)} aria-label="Dismiss">×</button>
        </div>
      ))}
    </div>
  );
}
