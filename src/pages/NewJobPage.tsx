import {
  useState,
  type ChangeEventHandler,
  type FormEventHandler,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "./NewJobPage.css";

interface NewJobForm {
  repoUrl: string;
  instruction: string;
  branchName: string;
  prTitle: string;
}

interface Example {
  label: string;
  instruction: string;
}

const EXAMPLES = [
  {
    label: "Async refactor",
    instruction: "Refactor all database calls in src/db/ to use async/await",
  },
  {
    label: "Add type hints",
    instruction: "Add TypeScript type hints to all exported functions",
  },
  {
    label: "Write tests",
    instruction: "Write unit tests for all functions in utils/ folder",
  },
  {
    label: "Add README",
    instruction:
      "Create a comprehensive README.md with setup and usage instructions",
  },
] satisfies Example[];

export default function NewJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<NewJobForm>({
    repoUrl: "",
    instruction: "",
    branchName: "",
    prTitle: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set =
    (
      k: keyof NewJobForm,
    ): ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> =>
    (e) =>
      setForm({ ...form, [k]: e.target.value });

  const autoSlug = (str: string): string =>
    "repomind/" +
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 50);

  const [assistantSuggestion, setAssistantSuggestion] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);

  const createAssistantSuggestion = (text: string): string => {
    const trimmed = text.trim();
    if (!trimmed) {
      return 'Describe the change you want in detail, including the target files, behavior, and any constraints. Example: "Update src/utils/api.ts to retry failed GitHub requests with exponential backoff and add error handling tests."';
    }

    let suggestion = trimmed;
    if (!/[.?!]$/.test(suggestion)) suggestion += ".";
    if (
      !/^(Fix|Update|Add|Remove|Refactor|Implement|Create|Improve)/i.test(
        suggestion,
      )
    ) {
      suggestion = suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
      suggestion =
        "Refactor " + suggestion.charAt(0).toLowerCase() + suggestion.slice(1);
    }
    if (
      !/\b(src|components|utils|pages|services|db|api|router|tests|README|documentation)\b/i.test(
        suggestion,
      )
    ) {
      suggestion +=
        " Focus on the relevant files and avoid unrelated refactors.";
    }
    if (
      !/\b(behavior|performance|tests|error handling|validation|logging|security|accessibility)\b/i.test(
        suggestion,
      )
    ) {
      suggestion +=
        " Include expected behavior and acceptance criteria when possible.";
    }
    return suggestion;
  };

  const handlePromptAssistant = (): void => {
    setAssistantLoading(true);
    const suggestion = createAssistantSuggestion(form.instruction);
    setAssistantSuggestion(suggestion);
    setAssistantOpen(true);
    setAssistantLoading(false);
  };

  const applyAssistantSuggestion = (): void => {
    setForm((f) => ({ ...f, instruction: assistantSuggestion }));
    setAssistantOpen(false);
  };

  const applyExample = (ex: Example): void => {
    setForm((f) => ({
      ...f,
      instruction: ex.instruction,
      branchName: autoSlug(ex.instruction),
      prTitle: `repomind: ${ex.instruction.slice(0, 60)}`,
    }));
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.repoUrl.startsWith("https://github.com/")) {
      setError("Please enter a valid GitHub repository URL");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/jobs", form);
      navigate(`/jobs/${data._id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Job</h1>
          <p className="page-sub">
            The bot will open a PR on the target repository as configured in
            SENDROOM.
          </p>
        </div>
      </div>

      <div className="new-job-layout">
        <form onSubmit={handleSubmit} className="job-form card">
          <div className="field">
            <label>Repository URL</label>
            <input
              type="url"
              placeholder="https://github.com/owner/repo"
              value={form.repoUrl}
              onChange={set("repoUrl")}
              required
            />
            <span className="field-hint">
              Public GitHub repository the bot will clone and modify
            </span>
          </div>

          <div className="field">
            <label>Instruction</label>
            <div className="assistant-bar">
              <button
                type="button"
                className="btn-ghost assistant-btn assistant-pulse"
                onClick={handlePromptAssistant}
                disabled={assistantLoading}
              >
                AI Suggestion
              </button>
              <span className="assistant-hint">
                In-app AI helper that improves your instruction before
                submitting a job.
              </span>
            </div>
            <textarea
              placeholder="Describe the code change you want in plain English..."
              value={form.instruction}
              onChange={set("instruction")}
              rows={4}
              required
            />
            <span className="field-hint">
              Be as specific as possible — file paths, patterns, or behaviors
              help the agent plan better.
            </span>
          </div>

          {assistantOpen && (
            <div className="assistant-card card assistant-card-open">
              <div className="assistant-card-header">
                <div>
                  <div className="assistant-card-title">AI Suggestion</div>
                  <div className="assistant-card-sub">
                    Improved instruction to help the bot understand your goal.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-ghost assistant-refresh"
                  onClick={handlePromptAssistant}
                >
                  Refresh
                </button>
              </div>
              <p className="assistant-text">{assistantSuggestion}</p>
              <div className="assistant-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={applyAssistantSuggestion}
                >
                  Use suggestion
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setAssistantOpen(false)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="two-col">
            <div className="field">
              <label>
                Branch Name <span className="optional">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="repomind/your-branch-name"
                value={form.branchName}
                onChange={set("branchName")}
              />
            </div>
            <div className="field">
              <label>
                PR Title <span className="optional">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="refactor: ..."
                value={form.prTitle}
                onChange={set("prTitle")}
              />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Launching job...
                </>
              ) : (
                "Launch PR Job →"
              )}
            </button>
          </div>
        </form>

        <div className="job-sidebar">
          <div className="card quick-examples">
            <h3 className="examples-title">Quick examples</h3>
            <div className="examples-list">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  className="example-btn"
                  onClick={() => applyExample(ex)}
                >
                  <span className="example-label">{ex.label}</span>
                  <span className="example-text">{ex.instruction}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card bot-info">
            <h3 className="bot-info-title">
              <span>🤖</span> How it works
            </h3>
            <ol className="bot-steps">
              <li>You submit a repo URL + instruction</li>
              <li>RepoMind's bot clones the repo</li>
              <li>GPT-4o plans and applies changes</li>
              <li>Bot opens PR on your behalf</li>
              <li>You review and merge!</li>
            </ol>
            <div className="bot-note">
              The PR is opened by the <code>SENDROOM</code> bot user configured
              in server environment — not your personal GitHub account.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
