import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import api from "../utils/api";
import "./DashboardPage.css";

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function repoName(url) {
  try { return url.split("github.com/")[1] || url; } catch { return url; }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get("/jobs");
      setJobs(data);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = {
    total: jobs.length,
    running: jobs.filter((j) => j.status === "running").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed: jobs.filter((j) => j.status === "failed").length,
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Hey, <span style={{ color: "var(--text)" }}>{user?.username}</span> — here are your RepoMind jobs.</p>
        </div>
        <Link to="/jobs/new" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: "Total Jobs", value: stats.total, color: "var(--text)" },
          { label: "Running", value: stats.running, color: "var(--blue)" },
          { label: "Completed", value: stats.completed, color: "var(--accent)" },
          { label: "Failed", value: stats.failed, color: "var(--red)" },
        ].map((s) => (
          <div className="stat-card card" key={s.label}>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Jobs list */}
      <div className="jobs-section">
        <h2 className="section-title">Recent Jobs</h2>

        {loading && (
          <div className="empty-state">
            <div className="spinner"></div>
            <span>Loading jobs...</span>
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="empty-state card">
            <div className="empty-icon">📭</div>
            <h3>No jobs yet</h3>
            <p>Create your first RepoMind job to have the bot open a PR for you.</p>
            <Link to="/jobs/new" className="btn-primary" style={{ marginTop: 12, display: "inline-block" }}>
              Create first job →
            </Link>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className="jobs-list">
            {jobs.map((job) => (
              <div key={job._id} className="job-row card" onClick={() => navigate(`/jobs/${job._id}`)}>
                <div className="job-main">
                  <div className="job-repo">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--text3)", flexShrink: 0 }}>
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <code className="repo-name">{repoName(job.repoUrl)}</code>
                  </div>
                  <p className="job-instruction">{job.instruction}</p>
                  <div className="job-branch">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                      <path d="M18 9a9 9 0 0 1-9 9"/>
                    </svg>
                    {job.branchName}
                  </div>
                </div>
                <div className="job-right">
                  <StatusBadge status={job.status} />
                  <span className="job-time">{timeAgo(job.createdAt)}</span>
                  {job.prUrl && (
                    <a href={job.prUrl} target="_blank" rel="noopener noreferrer"
                      className="pr-link" onClick={(e) => e.stopPropagation()}>
                      View PR ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
