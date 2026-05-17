import { useState, useEffect, type ChangeEventHandler, type FormEventHandler } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import type { Settings } from "../types";
import "./SettingsPage.css";

type SettingsForm = Pick<Settings, "githubUsername" | "githubToken" | "openaiKey">;

interface TokenVisibility {
  github: boolean;
  openai: boolean;
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    githubUsername: "",
    githubToken: "",
    openaiKey: "",
    hasGithubToken: false,
    hasOpenaiKey: false,
  });
  const [form, setForm] = useState<SettingsForm>({ githubUsername: "", githubToken: "", openaiKey: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showTokens, setShowTokens] = useState<TokenVisibility>({ github: false, openai: false });

  useEffect(() => {
    api.get("/settings").then(({ data }) => {
      setSettings(data as Settings);
      setForm({ githubUsername: data.githubUsername, githubToken: "", openaiKey: "" });
    });
  }, []);

  const set =
    (k: keyof SettingsForm): ChangeEventHandler<HTMLInputElement> =>
    (e) =>
      setForm({ ...form, [k]: e.target.value });

  const handleSave: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.put("/settings", form);
      await refreshUser();
      setSaved(true);
      setForm((f) => ({ ...f, githubToken: "", openaiKey: "" }));
      const { data } = await api.get("/settings");
      setSettings(data as Settings);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Configure your GitHub token and OpenAI key for RepoMind.</p>
        </div>
      </div>

      <div className="settings-layout">
        <form onSubmit={handleSave} className="settings-form">

          {/* Profile section */}
          <div className="settings-section card">
            <h2 className="settings-section-title">Profile</h2>
            <div className="field">
              <label>Username</label>
              <input type="text" value={user?.username || ""} disabled style={{ opacity: 0.5 }} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={user?.email || ""} disabled style={{ opacity: 0.5 }} />
            </div>
          </div>

          {/* GitHub section */}
          <div className="settings-section card">
            <h2 className="settings-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              GitHub (your account)
            </h2>
            <div className="settings-note">
              Your personal GitHub username helps with display. The actual PR bot uses the <code>SENDROOM</code> bot configured in the server environment.
            </div>
            <div className="field">
              <label>Your GitHub Username</label>
              <input type="text" placeholder="octocat" value={form.githubUsername} onChange={set("githubUsername")} />
            </div>
            <div className="field">
              <label>
                Personal Access Token
                {settings.hasGithubToken && <span className="token-saved">✓ saved</span>}
              </label>
              <div className="token-field">
                <input
                  type={showTokens.github ? "text" : "password"}
                  placeholder={settings.hasGithubToken ? "Enter new token to replace" : "ghp_..."}
                  value={form.githubToken}
                  onChange={set("githubToken")}
                />
                <button type="button" className="show-btn"
                  onClick={() => setShowTokens((s) => ({ ...s, github: !s.github }))}>
                  {showTokens.github ? "hide" : "show"}
                </button>
              </div>
              <span className="field-hint">
                Needs <code>repo</code> scope. Used for verifying repository access in future features.
              </span>
            </div>
          </div>

          {/* OpenAI section */}
          <div className="settings-section card">
            <h2 className="settings-section-title">🧠 OpenAI</h2>
            <div className="settings-note">
              The server uses the OpenAI key configured in <code>REPOMIND_API_URL</code>'s environment. You can optionally store your own key here for future per-user billing support.
            </div>
            <div className="field">
              <label>
                OpenAI API Key
                {settings.hasOpenaiKey && <span className="token-saved">✓ saved</span>}
              </label>
              <div className="token-field">
                <input
                  type={showTokens.openai ? "text" : "password"}
                  placeholder={settings.hasOpenaiKey ? "Enter new key to replace" : "sk-..."}
                  value={form.openaiKey}
                  onChange={set("openaiKey")}
                />
                <button type="button" className="show-btn"
                  onClick={() => setShowTokens((s) => ({ ...s, openai: !s.openai }))}>
                  {showTokens.openai ? "hide" : "show"}
                </button>
              </div>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : saved ? "✓ Saved!" : "Save settings"}
            </button>
          </div>
        </form>

        {/* Stats sidebar */}
        <div className="settings-side">
          <div className="card stats-mini">
            <h3 className="settings-section-title" style={{ marginBottom: 16 }}>Your Stats</h3>
            <div className="mini-stat">
              <div className="mini-stat-val" style={{ color: "var(--blue)" }}>{user?.totalJobs || 0}</div>
              <div className="mini-stat-label">Total Jobs</div>
            </div>
            <div className="mini-stat">
              <div className="mini-stat-val" style={{ color: "var(--accent)" }}>{user?.successfulPRs || 0}</div>
              <div className="mini-stat-label">Successful PRs</div>
            </div>
          </div>

          <div className="card bot-status-card">
            <h3 className="settings-section-title" style={{ marginBottom: 12 }}>SENDROOM Bot</h3>
            <div className="bot-status-row">
              <div className="bot-status-dot"></div>
              <span className="bot-status-text">Configured via server env</span>
            </div>
            <div className="settings-note" style={{ marginTop: 10 }}>
              The bot user is set in your server's <code>REPOMIND_GITHUB_TOKEN</code> and <code>REPOMIND_GITHUB_USERNAME</code> env vars. It creates PRs for all users.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
