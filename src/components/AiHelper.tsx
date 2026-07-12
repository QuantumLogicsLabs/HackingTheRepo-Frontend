"use client";

import { useState, useEffect, useRef } from "react";

interface AiHelperProps {
  repoUrl: string;
  instruction: string;
  branchName: string;
  prTitle: string;
}

interface Tip {
  title: string;
  body: string;
}

function getTips({ repoUrl, instruction, branchName, prTitle }: AiHelperProps): Tip[] {
  const tips: Tip[] = [];

  if (!repoUrl) {
    tips.push({
      title: "Repository URL",
      body: "Paste the full GitHub URL, e.g. https://github.com/owner/repo. The repo must be public so the bot can clone it.",
    });
  } else if (!repoUrl.startsWith("https://github.com/")) {
    tips.push({
      title: "Invalid URL",
      body: "Only public GitHub repositories are supported. Make sure the URL starts with https://github.com/",
    });
  }

  if (!instruction) {
    tips.push({
      title: "Write a clear instruction",
      body: "Describe the exact change you want. Include file paths (e.g. src/utils/auth.ts), the behavior to change, and any constraints.",
    });
    tips.push({
      title: "Good instruction examples",
      body: "• \"Refactor all database calls in src/db/ to use async/await\"\n• \"Add unit tests for the login flow in src/auth/\"\n• \"Fix the off-by-one error in pagination\"",
    });
  } else {
    const hasPaths = /\b(src|lib|components|pages|utils|hooks|api|tests?)\b/i.test(instruction);
    if (!hasPaths) {
      tips.push({
        title: "Add file paths",
        body: "Include specific files or folders (e.g. src/utils/, components/Button.tsx) so the agent knows exactly where to make changes.",
      });
    }
    if (instruction.length < 20) {
      tips.push({
        title: "Be more specific",
        body: "Longer, detailed instructions produce better results. Mention what to change, how to change it, and any edge cases.",
      });
    }
  }

  if (instruction && !branchName) {
    tips.push({
      title: "Branch name",
      body: "Leave blank to auto-generate, or set a descriptive name like repomind/fix-auth-bug so the PR is easy to identify.",
    });
  }

  if (repoUrl && instruction && !prTitle) {
    tips.push({
      title: "PR title",
      body: "A clear title like \"refactor: migrate auth to async/await\" helps reviewers understand the change at a glance.",
    });
  }

  if (repoUrl && instruction) {
    tips.push({
      title: "Preview before PR",
      body: "Enable \"Review the AI-generated diff\" to see exactly what changes the bot plans to make before a PR is opened.",
    });
  }

  if (tips.length === 0) {
    tips.push({
      title: "You're all set!",
      body: "Review your inputs and hit \"Launch PR Job\" when ready. You can also refine the instruction after the diff is generated.",
    });
  }

  return tips;
}

export default function AiHelper(props: AiHelperProps) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const tips = getTips(props);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (minimized) {
    return (
      <button
        className="ai-helper-minimized"
        onClick={() => { setMinimized(false); setOpen(true); }}
        title="Open AI Helper"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
          <line x1="10" y1="22" x2="14" y2="22" />
        </svg>
      </button>
    );
  }

  return (
    <div className={`ai-helper-float${open ? " ai-helper-open" : ""}`} ref={panelRef}>
      {!open && (
        <button
          className="ai-helper-bubble"
          onClick={() => setOpen(true)}
          title="AI Helper — tips for better instructions"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
            <line x1="10" y1="22" x2="14" y2="22" />
          </svg>
          <span className="ai-helper-pulse" />
        </button>
      )}

      {open && (
        <div className="ai-helper-panel">
          <div className="ai-helper-header">
            <div className="ai-helper-header-left">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                <line x1="10" y1="22" x2="14" y2="22" />
              </svg>
              <span className="ai-helper-label">AI Helper</span>
            </div>
            <div className="ai-helper-header-actions">
              <button
                className="ai-helper-action-btn"
                onClick={() => { setOpen(false); setMinimized(true); }}
                title="Minimize"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button
                className="ai-helper-action-btn"
                onClick={() => setOpen(false)}
                title="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
          <div className="ai-helper-tips">
            {tips.map((tip, i) => (
              <div key={i} className="ai-helper-tip">
                <div className="ai-helper-tip-title">{tip.title}</div>
                <div className="ai-helper-tip-body">{tip.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
