import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  Bot, Terminal, RefreshCw, Sparkles, FolderSync,
  GitBranch, GitCommit, CheckCircle, XCircle, Clock,
  Code, Database, Cpu, Activity, AlertTriangle, Zap,
  Wifi, WifiOff, Copy, ClipboardCheck, ShieldCheck,
  ListTodo, ChevronDown, ChevronUp
} from 'lucide-react';
import './index.css';

const API = "http://localhost:5000";
const REPOS = (process.env.REACT_APP_GITHUB_REPOS || "")
  .split(',').map(r => r.trim()).filter(Boolean);

/* ── Helpers ─────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    'in-progress': { label: 'Running', cls: 'badge-running' },
    'completed':   { label: 'Done',    cls: 'badge-success' },
    'failed':      { label: 'Failed',  cls: 'badge-error' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'badge-pending' };
  return <span className={`badge ${cls}`}>{label}</span>;
}

function RiskBadge({ level }) {
  const map = {
    low:    { label: '🟢 Low',    cls: 'badge-success' },
    medium: { label: '🟡 Medium', cls: 'badge-pending' },
    high:   { label: '🔴 High',   cls: 'badge-error' },
  };
  const { label, cls } = map[level] || { label: level, cls: 'badge-pending' };
  return <span className={`badge ${cls}`} style={{ fontSize: '0.7rem' }}>{label}</span>;
}

function RepoCard({ repo, isActive, isRunning }) {
  const parts = repo.split('/');
  const name  = parts[1] || repo;
  const owner = parts[0] || '';
  return (
    <div className={`repo-card ${isActive ? 'repo-card-active' : ''}`}>
      <div className="repo-card-header">
        <GitBranch size={16} className="repo-icon" />
        <div style={{ flex: 1 }}>
          <div className="repo-name">{name}</div>
          <div className="repo-owner">{owner}</div>
        </div>
        {isActive && isRunning && <div className="pulse-dot" title="AI Active" />}
      </div>
      <div className="repo-meta">
        <Code size={11} />
        <span>{owner}/{name}</span>
        {isActive && isRunning && <span className="active-label">⚡ AI Active</span>}
      </div>
    </div>
  );
}

function parseRepoTarget(repoTarget) {
  const value = (repoTarget || '').trim();
  if (!value) return null;

  try {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      const parsed = new URL(value);
      const segments = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
      const owner = segments[0];
      const name = segments[1]?.replace(/\.git$/i, '');
      if (!owner || !name) return null;
      return { owner, name };
    }
  } catch {
    return null;
  }

  const parts = value.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (parts.length >= 2) {
    return { owner: parts[0], name: parts[1].replace(/\.git$/i, '') };
  }
  return null;
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card">
      <Icon size={22} color={color} />
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

/* ── Task Plan Panel ─────────────────────────────────── */
function TaskPlanPanel({ logs }) {
  const [expanded, setExpanded] = useState(true);
  const taskLogs = logs.filter(l => l.message && l.message.match(/\[\d+\] \[/));

  if (taskLogs.length === 0) return null;

  const typeColors = {
    bug_fix:  '#f85149',
    refactor: '#d29922',
    feature:  '#3fb950',
    docs:     '#58a6ff',
    test:     '#bc8cff',
  };

  return (
    <div style={{ border: '1px solid var(--panel-border)', borderRadius: 10, marginBottom: '1rem', overflow: 'hidden' }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.6rem 1rem', cursor: 'pointer',
          background: 'rgba(88, 166, 255, 0.06)',
          borderBottom: expanded ? '1px solid var(--panel-border)' : 'none'
        }}
      >
        <ListTodo size={15} color="#58a6ff" />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, flex: 1, color: '#58a6ff' }}>
          AI Task Plan ({taskLogs.length} tasks)
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>
      {expanded && (
        <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {taskLogs.map((log, i) => {
            const match = log.message.match(/\[(\d+)\] \[(\w+)\] (.+?) \((\w+) risk\)/);
            if (!match) return <div key={i} style={{ fontSize: '0.8rem', opacity: 0.7 }}>{log.message}</div>;
            const [, priority, type, title, risk] = match;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                <span style={{ color: '#888', minWidth: 20 }}>#{priority}</span>
                <span style={{
                  background: typeColors[type] + '22',
                  color: typeColors[type] || '#aaa',
                  padding: '1px 6px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600,
                  border: `1px solid ${typeColors[type] || '#aaa'}44`
                }}>{type.replace('_', ' ')}</span>
                <span style={{ flex: 1, color: 'var(--text-main)' }}>{title}</span>
                <RiskBadge level={risk} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Self-Review indicator in logs ───────────────────── */
function LogLine({ log }) {
  const isSelfReview = log.message && log.message.includes('[review:');
  const isRejected   = log.message && log.message.includes('Self-review rejected');

  const iconMap = {
    success: <CheckCircle size={13} color="var(--success-color)" />,
    error:   <XCircle    size={13} color="var(--error-color)"   />,
    warning: <AlertTriangle size={13} color="var(--warning-color)" />,
    info:    <span style={{ width: 13 }} />,
  };

  return (
    <div className={`log-line log-${log.type || 'info'}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
      <span style={{ flexShrink: 0, marginTop: 2 }}>{iconMap[log.type] || iconMap.info}</span>
      <span style={{ flex: 1 }}>
        {log.message}
        {isSelfReview && <ShieldCheck size={11} style={{ marginLeft: 4, verticalAlign: 'middle', color: '#3fb950' }} />}
        {isRejected   && <ShieldCheck size={11} style={{ marginLeft: 4, verticalAlign: 'middle', color: '#f85149' }} />}
      </span>
    </div>
  );
}

/* ── Planning Chat ──────────────────────────────────── */
function PlanningChat({ repository, onResolved, isAgentRunning }) {
  const [messages, setMessages]   = useState([
    { role: 'assistant', content: 'Hello! I am your Quantum AI Agent. Tell me what to improve and I will handle everything — plan, code, review, and PR.' }
  ]);
  const [input, setInput]         = useState('');
  const [chatId, setChatId]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [resolvedPlan, setResolvedPlan] = useState(null);
  const bottomRef                 = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository, message: userMsg, chatId }),
      });
      const data = await res.json();
      setChatId(data._id);

      const lastMsg = data.messages[data.messages.length - 1];
      setMessages(m => [...m, { role: 'assistant', content: lastMsg?.content || '...' }]);

      if (data.status === 'resolved' && data.resolvedInstructions) {
        setResolvedPlan(data.resolvedInstructions);
      }
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, chatId, repository]);

  return (
    <div>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          {loading && <div className="chat-bubble assistant"><span className="loader" /></div>}
          <div ref={bottomRef} />
        </div>
        <div className="chat-input-area">
          <input
            className="chat-input"
            placeholder="e.g. Fix all bugs and add error handling..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={loading || isAgentRunning}
          />
          <button className="fetch-btn chat-send-btn" onClick={send} disabled={loading || isAgentRunning}>
            {loading ? <span className="loader" /> : <Sparkles size={14} />}
          </button>
        </div>
      </div>

      {resolvedPlan && !isAgentRunning && (
        <div className="plan-ready-banner">
          <b>✅ Plan ready — Agent will run fully autonomously</b>
          <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{resolvedPlan}</div>
          <button
            className="fetch-btn"
            style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}
            onClick={() => onResolved(resolvedPlan)}
          >
            <Zap size={13} /> Launch Autonomous Agent
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Job Detail Panel ────────────────────────────────── */
function JobDetail({ jobId }) {
  const [job, setJob]       = useState(null);
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const terminalRef           = useRef(null);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/agent/jobs/${jobId}`);
      const data = await res.json();
      setJob(data.job);
      setLogs(data.logs || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  // Live logs via socket
  useEffect(() => {
    const socket = io(API);
    socket.on(`agent-status-${jobId}`, (payload) => {
      setLogs(prev => [...prev, payload]);
    });
    return () => socket.disconnect();
  }, [jobId]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const copyLogs = useCallback(() => {
    const text = logs.map(l => `[${l.type?.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
  }, [logs]);

  if (loading) return <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading job details...</div>;
  if (!job) return <div style={{ padding: '1rem', color: 'var(--error-color)' }}>Job not found.</div>;

  const modifiedCount = logs.filter(l => l.type === 'success' && l.message?.startsWith('  ✓ Updated:')).length;
  const selfReviewCount = logs.filter(l => l.message?.includes('[review:')).length;

  return (
    <div>
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1rem' }}>
        <StatCard icon={Activity}    label="Status"   value={job.status}        color="#58a6ff" />
        <StatCard icon={GitCommit}   label="Modified" value={modifiedCount}     color="#3fb950" />
        <StatCard icon={ShieldCheck} label="Reviewed" value={selfReviewCount}   color="#bc8cff" />
        <StatCard icon={Terminal}    label="Log Lines" value={logs.length}      color="#d29922" />
      </div>

      <TaskPlanPanel logs={logs} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live terminal</span>
        <button className="clear-btn" onClick={copyLogs} title="Copy all logs">
          <Copy size={11} /> Copy
        </button>
      </div>

      <div ref={terminalRef} className="terminal-output" style={{ maxHeight: 380, overflowY: 'auto' }}>
        {logs.length === 0 ? (
          <div className="terminal-placeholder">
            <Terminal size={28} opacity={0.3} />
            <span>No logs yet...</span>
          </div>
        ) : (
          logs.map((log, i) => <LogLine key={i} log={log} />)
        )}
      </div>
    </div>
  );
}

/* ── Main App ─────────────────────────────────────────── */
export default function App() {
  const [jobs, setJobs]             = useState([]);
  const [activeJobId, setActiveJobId] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(REPOS[0] || '');
  const [customRepo, setCustomRepo] = useState('');
  const [isRunning, setIsRunning]   = useState(false);
  const [connected, setConnected]   = useState(false);
  const [globalLogs, setGlobalLogs] = useState([]);
  const [view, setView]             = useState('dashboard'); // 'dashboard' | 'job'
  const socketRef                   = useRef(null);
  const repoTarget = customRepo.trim() || selectedRepo;
  const parsedRepo = parseRepoTarget(repoTarget);
  const prRepoPath = parsedRepo ? `${parsedRepo.owner}/${parsedRepo.name}` : '';

  // Socket connection
  useEffect(() => {
    const socket = io(API);
    socketRef.current = socket;
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('global-activity', (payload) => {
      setGlobalLogs(prev => [payload, ...prev].slice(0, 50));
    });
    return () => socket.disconnect();
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/agent/jobs`);
      const data = await res.json();

      // ── BUG FIX: Guard against non-array responses (e.g. { error: "..." }
      // from the backend, or HTML error pages parsed as objects). Without this
      // check, jobs.filter / jobs.find crash the entire React tree.
      if (!Array.isArray(data)) {
        console.warn('[fetchJobs] Expected array but got:', data);
        return;
      }

      setJobs(data);
      const running = data.find(j => j.status === 'in-progress');
      setIsRunning(!!running);
      if (running) setActiveJobId(running._id);
    } catch (err) {
      console.warn('[fetchJobs] Network error:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 8000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const launchAgent = useCallback(async (instructions) => {
    const target = customRepo.trim() || selectedRepo;
    const parsed = parseRepoTarget(target);
    if (!parsed) return;
    const { owner: repoOwner, name: repoName } = parsed;

    try {
      setIsRunning(true);
      const res = await fetch(`${API}/api/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoOwner, repoName, instructions }),
      });
      const data = await res.json();
      setActiveJobId(data.jobId);
      setView('job');
      fetchJobs();
    } catch (e) {
      setIsRunning(false);
      console.error('Launch error:', e.message);
    }
  }, [customRepo, selectedRepo, fetchJobs]);

  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const failedJobs    = jobs.filter(j => j.status === 'failed').length;
  const totalJobs     = jobs.length;

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-logo">
          <Bot size={28} color="#58a6ff" />
          <h1>Quantum AI Agent</h1>
          <span style={{ fontSize: '0.7rem', background: 'rgba(88,166,255,0.15)', color: '#58a6ff', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
            AUTONOMOUS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {connected
            ? <><Wifi size={14} color="#3fb950" /><span style={{ color: '#3fb950', fontSize: '0.8rem' }}>Live</span></>
            : <><WifiOff size={14} color="#f85149" /><span style={{ color: '#f85149', fontSize: '0.8rem' }}>Offline</span></>
          }
        </div>
      </div>

      {/* Nav tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {['dashboard', 'job'].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`fetch-btn ${view === v ? '' : 'clear-btn'}`}
            style={{ fontSize: '0.8rem' }}
          >
            {v === 'dashboard' ? <><FolderSync size={13} /> Dashboard</> : <><Terminal size={13} /> Active Job</>}
          </button>
        ))}
        {activeJobId && prRepoPath && (
          <a
            href={`https://github.com/${prRepoPath}/pulls`}
            target="_blank"
            rel="noreferrer"
            className="clear-btn"
            style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', textDecoration: 'none' }}
          >
            <GitBranch size={13} /> View PR
          </a>
        )}
      </div>

      {view === 'dashboard' && (
        <>
          {/* Stats */}
          <div className="stats-row">
            <StatCard icon={Database}   label="Total Jobs"    value={totalJobs}     color="#58a6ff" />
            <StatCard icon={CheckCircle} label="Completed"    value={completedJobs} color="#3fb950" />
            <StatCard icon={XCircle}    label="Failed"        value={failedJobs}    color="#f85149" />
            <StatCard icon={Cpu}        label="Agent Status"  value={isRunning ? 'Running' : 'Idle'} color={isRunning ? '#d29922' : '#3fb950'} />
          </div>

          <div className="two-col dashboard-grid">
            {/* Left: Repos + Chat */}
            <div className="dashboard-left-col">
              <div className="panel repository-panel">
                <div className="panel-header">
                  <GitBranch size={15} />
                  <span>Target Repository</span>
                </div>
                {REPOS.length > 0 && (
                  <div className="repo-list-wrap">
                    {REPOS.map(r => (
                      <div key={r} onClick={() => setSelectedRepo(r)} style={{ cursor: 'pointer' }}>
                        <RepoCard repo={r} isActive={selectedRepo === r} isRunning={isRunning} />
                      </div>
                    ))}
                  </div>
                )}
                <input
                  className="repo-input"
                  placeholder="Or paste any GitHub URL / owner/repo"
                  value={customRepo}
                  onChange={e => setCustomRepo(e.target.value)}
                  style={{ marginBottom: '0.75rem' }}
                />
              </div>

              <div className="panel instruction-panel">
                <div className="panel-header">
                  <Sparkles size={15} />
                  <span>Instruct the Agent</span>
                </div>
                <PlanningChat
                  repository={customRepo.trim() || selectedRepo}
                  onResolved={launchAgent}
                  isAgentRunning={isRunning}
                />
                <button
                  className="fetch-btn"
                  style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
                  onClick={() => launchAgent('Analyze the codebase. Fix bugs, improve code quality, add useful comments, and apply best-practice improvements.')}
                  disabled={isRunning || (!customRepo.trim() && !selectedRepo)}
                >
                  {isRunning
                    ? <><span className="loader" /> Agent Running...</>
                    : <><Zap size={14} /> Run Full Autonomous Agent</>
                  }
                </button>
              </div>
            </div>

            {/* Right: Job History + Live Feed */}
            <div className="dashboard-right-col">
              <div className="panel jobs-panel">
                <div className="panel-header">
                  <Activity size={15} />
                  <span>Recent Jobs</span>
                  <button className="clear-btn" onClick={fetchJobs}><RefreshCw size={11} /></button>
                </div>
                <div className="jobs-list">
                  {jobs.slice(0, 6).map(job => (
                    <div
                      className="job-item"
                      key={job._id}
                      onClick={() => { setActiveJobId(job._id); setView('job'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.6rem 0.75rem', borderRadius: 8, cursor: 'pointer',
                        background: activeJobId === job._id ? 'rgba(88,166,255,0.08)' : 'transparent',
                        border: `1px solid ${activeJobId === job._id ? 'rgba(88,166,255,0.3)' : 'transparent'}`,
                        transition: 'all 0.15s'
                      }}
                    >
                      <GitCommit size={13} color="#58a6ff" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {job.repoOwner}/{job.repoName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {job.instructions?.substring(0, 60)}...
                        </div>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No jobs yet. Launch the agent above.
                    </div>
                  )}
                </div>
              </div>

              <div className="panel activity-panel">
                <div className="panel-header">
                  <Zap size={15} />
                  <span>Global Activity Feed</span>
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {globalLogs.slice(0, 20).map((log, i) => (
                    <div key={i} style={{ fontSize: '0.78rem', color: log.type === 'success' ? 'var(--success-color)' : log.type === 'error' ? 'var(--error-color)' : 'var(--text-muted)' }}>
                      {log.message?.substring(0, 80)}
                    </div>
                  ))}
                  {globalLogs.length === 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>Waiting for activity...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {view === 'job' && (
        <div className="panel">
          <div className="panel-header">
            <Terminal size={15} />
            <span>Job Details — {activeJobId ? activeJobId.toString().slice(-8) : 'None'}</span>
            {isRunning && <span className="live-badge">LIVE</span>}
          </div>
          {activeJobId
            ? <JobDetail jobId={activeJobId} />
            : <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No active job selected.</div>
          }
        </div>
      )}
    </div>
  );
}