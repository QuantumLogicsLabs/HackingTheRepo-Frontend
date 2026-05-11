import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import api from "../utils/api";
import "./JobDetailPage.css";

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refineText, setRefineText] = useState("");
  const [refining, setRefining] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pollingRef = useRef(null);

  const fetchJob = useCallback(
    async (poll = false) => {
      try {
        const endpoint = poll ? `/jobs/${id}/status` : `/jobs/${id}`;
        const { data } = await api.get(endpoint);
        setJob(data);
        return data;
      } catch {
        navigate("/dashboard");
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [id, navigate]
  );

  useEffect(() => {
    setLoading(true);
    fetchJob();
  }, [id, fetchJob]);

  /** Poll while job is in progress; clear when terminal or unmount */
  useEffect(() => {
    const status = job?.status;
    if (status !== "running" && status !== "queued") return;

    pollingRef.current = window.setInterval(async () => {
      const updated = await fetchJob(true);
      if (updated?.status === "completed" || updated?.status === "failed") {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 5000);

    return () => {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    };
  }, [job?.status, fetchJob]);

  const handleRefine = async () => {
    if (!refineText.trim()) return;
    setRefining(true);
    try {
      const { data } = await api.post(`/jobs/${id}/refine`, { instruction: refineText });
      setJob(data);
      setRefineText("");
    } finally {
      setRefining(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this job?")) return;
    setDeleting(true);
    try {
      await api.delete(`/jobs/${id}`);
      navigate("/dashboard");
    } catch {
      alert("Could not delete this job. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="page" style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text2)" }}>
      <div className="spinner"></div> Loading job...
    </div>
  );

  if (!job) return null;

  return (
    <div className="page fade-in">
      <div className="job-detail-header">
        <Link to="/dashboard" className="back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </Link>
        <button className="btn-danger" onClick={handleDelete} disabled={deleting} style={{ fontSize: 12, padding: "6px 14px" }}>
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <div className="job-detail-top">
        <div className="job-detail-title">
          <StatusBadge status={job.status} />
          <h1 className="page-title" style={{ fontSize: 18 }}>{job.prTitle}</h1>
        </div>
        <code className="repo-pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--text3)" }}>
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          {job.repoUrl.replace("https://github.com/", "")}
        </code>
      </div>

      <div className="job-detail-grid">
        {/* Left: details */}
        <div className="job-detail-main">
          {/* Info cards */}
          <div className="detail-section card">
            <div className="detail-row">
              <span className="detail-key">Instruction</span>
              <span className="detail-val">{job.instruction}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Branch</span>
              <code className="detail-code">{job.branchName}</code>
            </div>
            <div className="detail-row">
              <span className="detail-key">Job ID</span>
              <code className="detail-code" style={{ color: "var(--text3)", fontSize: 11 }}>{job.repomindJobId || "not yet assigned"}</code>
            </div>
            <div className="detail-row">
              <span className="detail-key">Created</span>
              <span className="detail-val">{new Date(job.createdAt).toLocaleString()} ({timeAgo(job.createdAt)})</span>
            </div>
          </div>

          {/* PR link */}
          {job.prUrl && (
            <div className="pr-success card">
              <div className="pr-success-icon">🎉</div>
              <div>
                <div className="pr-success-title">Pull Request Opened!</div>
                <a href={job.prUrl} target="_blank" rel="noopener noreferrer" className="pr-url-link">
                  {job.prUrl} ↗
                </a>
              </div>
            </div>
          )}

          {/* Diff summary */}
          {job.diffSummary && (
            <div className="diff-card card">
              <h3 className="diff-title">Diff Summary</h3>
              <p className="diff-text">{job.diffSummary}</p>
            </div>
          )}

          {/* Error */}
          {job.errorMessage && (
            <div className="error-card card">
              <div className="error-icon">⚠️</div>
              <div>
                <div className="error-title">Issue</div>
                <div className="error-text">{job.errorMessage}</div>
              </div>
            </div>
          )}

          {/* Running indicator */}
          {(job.status === "running" || job.status === "queued") && (
            <div className="running-card card">
              <div className="running-anim">
                <div className="running-dot"></div>
                <div className="running-dot"></div>
                <div className="running-dot"></div>
              </div>
              <div>
                <div className="running-title">Agent is working...</div>
                <div className="running-sub">Status updates every 5 seconds. The bot is cloning, planning, and applying changes.</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: refine + history */}
        <div className="job-detail-side">
          {/* Refinement */}
          {(job.status === "completed" || job.status === "refined") && (
            <div className="card refine-card">
              <h3 className="refine-title">🔁 Refine PR</h3>
              <p className="refine-sub">Add a follow-up instruction to iterate on the same branch.</p>
              <textarea
                placeholder="e.g. Also add JSDoc comments to all new functions"
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                rows={3}
              />
              <button
                className="btn-primary"
                style={{ width: "100%", marginTop: 10 }}
                onClick={handleRefine}
                disabled={refining || !refineText.trim()}
              >
                {refining ? "Sending..." : "Send refinement →"}
              </button>
            </div>
          )}

          {/* Refinement history */}
          {job.refinements?.length > 0 && (
            <div className="card">
              <h3 className="refine-title">Refinement History</h3>
              <div className="refinement-list">
                {job.refinements.map((r, i) => (
                  <div key={i} className="refinement-item">
                    <span className="ref-num">#{i + 1}</span>
                    <div>
                      <div className="ref-instruction">{r.instruction}</div>
                      <div className="ref-time">{timeAgo(r.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw job id + manual poll */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>SENDROOM bot username</div>
            <code style={{ fontSize: 12, color: "var(--yellow)" }}>configured in server .env</code>
            <div style={{ marginTop: 14 }}>
              <button className="btn-ghost" style={{ width: "100%", fontSize: 12 }} onClick={() => fetchJob(true)}>
                ↻ Refresh status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
