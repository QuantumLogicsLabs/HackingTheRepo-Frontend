import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../utils/api";
import type { Job } from "../types";

export type NotificationKind = "info" | "success" | "error" | "warning";

export interface Notification {
  id: string;
  title: string;
  body?: string;
  kind?: NotificationKind;
  read?: boolean;
  timestamp: number;
  meta?: Record<string, unknown>;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "read" | "timestamp">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

function uid(prefix = "n"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "mock_1",
    title: "Welcome to RepoMind",
    body: "Submit your first job to get AI-powered code changes.",
    kind: "info",
    read: false,
    timestamp: Date.now() - 120_000,
  },
  {
    id: "mock_2",
    title: "RepoMind tip",
    body: "Press ? to see all keyboard shortcuts.",
    kind: "info",
    read: false,
    timestamp: Date.now() - 60_000,
  },
  {
    id: "mock_3",
    title: "System ready",
    body: "All services are operational. Ready to process jobs.",
    kind: "success",
    read: true,
    timestamp: Date.now() - 30_000,
  },
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const jobsRef = useRef<Record<string, string>>({});

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((n: Omit<Notification, "id" | "read" | "timestamp">) => {
    const note: Notification = {
      id: uid(),
      read: false,
      timestamp: Date.now(),
      ...n,
    };
    setNotifications((s) => [note, ...s].slice(0, 50));

    // Fire a react-hot-toast for every new notification
    const toastFn =
      n.kind === "error"
        ? toast.error
        : n.kind === "success"
          ? toast.success
          : toast;

    toastFn(n.body || n.title, {
      id: note.id,
      icon: undefined,
    });
  }, []);

  const markRead = useCallback(
    (id: string) => setNotifications((s) => s.map((n) => (n.id === id ? { ...n, read: true } : n))),
    [],
  );

  const markAllRead = useCallback(() => {
    setNotifications((s) => s.map((n) => ({ ...n, read: true })));
  }, []);

  const clear = useCallback(() => setNotifications([]), []);

  // Poll jobs and detect status transitions
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const { data } = await api.get("/jobs");
        const jobs = (data as Job[]) || [];

        const nextMap: Record<string, string> = {};
        jobs.forEach((j) => (nextMap[j._id] = j.status));

        Object.entries(nextMap).forEach(([id, status]) => {
          const prev = jobsRef.current[id];
          if (!prev) return;
          if (prev !== status) {
            if (status === "completed") {
              addNotification({ title: "Job completed", body: `Job ${id} completed successfully`, kind: "success", meta: { jobId: id } });
            } else if (status === "failed") {
              addNotification({ title: "Job failed", body: `Job ${id} failed — check the job details`, kind: "error", meta: { jobId: id } });
            } else if (status === "refined") {
              addNotification({ title: "Review requested", body: `Job ${id} needs review or changes`, kind: "info", meta: { jobId: id } });
            }
          }
        });

        jobsRef.current = nextMap;
      } catch {
        // ignore polling errors
      }
    };

    // initial load to populate ref without notifications
    (async () => {
      try {
        const { data } = await api.get("/jobs");
        const jobs = (data as Job[]) || [];
        const map: Record<string, string> = {};
        jobs.forEach((j) => (map[j._id] = j.status));
        jobsRef.current = map;
      } catch {
        // ignore
      }
    })();

    const iv = setInterval(() => { if (!cancelled) check(); }, 8000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markRead, markAllRead, clear }}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationContext;
