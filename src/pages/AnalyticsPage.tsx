import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import type { Job } from "../types";
import "./AnalyticsPage.css";

function repoName(url: string): string {
  try {
    return url.split("github.com/")[1] || url;
  } catch {
    return url;
  }
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const endpoint = isAdmin ? "/jobs?all=true" : "/jobs";
        const { data } = await api.get(endpoint);
        if (!mounted) return;
        setJobs(data as Job[]);
      } catch {
        setJobs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Success rate
  const total = jobs.length;
  const completed = jobs.filter((j) => j.status === "completed").length;
  const failed = jobs.filter((j) => j.status === "failed").length;
  const successRate =
    total === 0
      ? 0
      : Math.round((completed / Math.max(1, completed + failed)) * 100);

  // Most used repos
  const repoCounts: Record<string, number> = {};
  jobs.forEach((j) => {
    const r = repoName(j.repoUrl || "unknown");
    repoCounts[r] = (repoCounts[r] || 0) + 1;
  });
  const topRepos = Object.entries(repoCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Jobs per day (last 14 days)
  const countsByDay: Record<string, number> = {};
  const now = Date.now();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    countsByDay[key] = 0;
  }
  jobs.forEach((j) => {
    const key = new Date(j.createdAt).toISOString().slice(0, 10);
    if (key in countsByDay) countsByDay[key]++;
  });
  const trendPoints = Object.entries(countsByDay);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-sub">
            {isAdmin
              ? "Viewing analytics across all jobs in the system."
              : "Charts for success rate, most-used repos, and job volume trends."}
          </p>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="card analytics-card">
          <h3 className="analytics-title">Success Rate</h3>
          <div className="analytics-center">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path
                className="circle-bg"
                d="M18 2.0845
                   a 15.9155 15.9155 0 0 1 0 31.831
                   a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="circle"
                strokeDasharray={`${successRate}, 100`}
                d="M18 2.0845
                   a 15.9155 15.9155 0 0 1 0 31.831
                   a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">
                {successRate}%
              </text>
            </svg>
            <div className="analytics-sub">
              Completed: {completed} — Failed: {failed} — Total: {total}
            </div>
          </div>
        </div>

        <div className="card analytics-card">
          <h3 className="analytics-title">Most-used Repos</h3>
          <div className="repo-list">
            {topRepos.length === 0 && <div className="empty">No repos yet</div>}
            {topRepos.map(([repo, count], i) => {
              const max = topRepos[0]?.[1] || 1;
              const pct = Math.round((count / max) * 100);
              return (
                <div key={repo} className="repo-row">
                  <div className="repo-name">{repo}</div>
                  <div className="repo-bar">
                    <div
                      className="repo-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="repo-count">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card analytics-card">
          <h3 className="analytics-title">Jobs / Day (14 days)</h3>
          <div className="trend-chart">
            <svg viewBox="0 0 300 80" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#5CA8FF"
                strokeWidth="2"
                points={trendPoints
                  .map(([k, v], idx) => {
                    const x = (idx / Math.max(1, trendPoints.length - 1)) * 300;
                    const max = Math.max(...trendPoints.map((p) => p[1]), 1);
                    const y = 80 - (v / max) * 60 - 10;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            </svg>
            <div className="trend-labels">
              {trendPoints.map(([k]) => (
                <div key={k} className="trend-label">
                  {k.slice(5)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="loading">Loading analytics…</div>}
    </div>
  );
}
