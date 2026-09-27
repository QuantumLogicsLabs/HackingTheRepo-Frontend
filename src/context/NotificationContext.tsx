import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../utils/api";
import type { Job } from "../types";

export type NotificationKind = "info" | "success" | "error" | "warning";

export interface Notification {
  id: string;
  title: string;
  body?: string;
  kind?: NotificationKind;
  read?: boolean;
  meta?: Record<string, unknown>;
}

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, "id" | "read">) => void;
  markRead: (id: string) => void;
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

/** Has this job just reached a state the user should be told about? */
function classifyTransition(
  prevStatus: string,
  job: Job
): { title: string; body: string; kind: NotificationKind } | null {
  const { status, _id: id, previewBeforePush, prUrl } = job;

  if (status === prevStatus) return null;

  if (status === "failed") {
    return {
      title: "Job failed",
      body: `Job ${id.slice(-6)} failed — check the job details`,
      kind: "error",
    };
  }

  if (status === "completed") {
    // Preview was requested and no PR has been opened yet → needs the
    // user's review before RepoMind will open the PR.
    if (previewBeforePush && !prUrl) {
      return {
        title: "Review requested",
        body: `Job ${id.slice(-6)} finished a preview — review the diff to open the PR`,
        kind: "warning",
      };
    }
    return {
      title: "Job completed",
      body: `Job ${id.slice(-6)} completed successfully`,
      kind: "success",
    };
  }

  return null;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const jobsRef = useRef<Record<string, string>>({}); // jobId -> status
  const initializedRef = useRef(false);

  const addNotification = (n: Omit<Notification, "id" | "read">) => {
    const note: Notification = { id: uid(), read: false, ...n };
    setNotifications((s) => [note, ...s].slice(0, 50));
  };

  const markRead = (id: string) =>
    setNotifications((s) => s.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const clear = () => setNotifications([]);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const { data } = await api.get("/jobs");
        const jobs = (data as Job[]) || [];

        const nextMap: Record<string, string> = {};
        jobs.forEach((j) => (nextMap[j._id] = j.status));

        if (!initializedRef.current) {
          // First load: just snapshot current state, never notify —
          // avoids a wall of notifications firing on every page load.
          jobsRef.current = nextMap;
          initializedRef.current = true;
          return;
        }

        jobs.forEach((job) => {
          const prev = jobsRef.current[job._id];
          if (prev === undefined) return; // brand-new job, no transition to report

          const result = classifyTransition(prev, job);
          if (result) {
            addNotification({ ...result, meta: { jobId: job._id } });
          }
        });

        jobsRef.current = nextMap;
      } catch {
        // ignore polling errors — don't spam notifications for network blips
      }
    };

    check(); // run immediately (handles the initial snapshot too)
    const iv = setInterval(() => {
      if (!cancelled) check();
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markRead, clear }}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationContext;