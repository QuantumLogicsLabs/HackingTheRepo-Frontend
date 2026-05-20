import { useState, useEffect, useRef, type ReactElement } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import "./LandingPage.css";

interface TypingTextProps {
  text: string;
  delay?: number;
  started?: boolean;
  onComplete?: () => void;
  className?: string;
  showCursor?: boolean;
}

/**
 * Typewriter effect — keeps parent `onComplete` stable via ref so inline callbacks
 * do not restart the interval on every parent re-render (React StrictMode safe).
 */
const TypingText = ({
  text,
  delay = 25,
  started = true,
  onComplete,
  className = "",
  showCursor = true,
}: TypingTextProps): ReactElement | null => {
  const [displayedText, setDisplayedText] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!started) return;

    let index = 0;
    setDisplayedText("");
    setIsFinished(false);

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsFinished(true);
        onCompleteRef.current?.();
      }
    }, delay);

    return () => clearInterval(timer);
  }, [text, delay, started]);

  if (!started && displayedText === "") return null;

  return (
    <span className={className}>
      {displayedText}
      {started && !isFinished && showCursor && <span className="typing-cursor">|</span>}
    </span>
  );
};

export default function LandingPage(): ReactElement {
  const [phase, setPhase] = useState(0);

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          RepoMind
        </div>
        <div className="landing-nav">
          <ThemeToggle className="theme-toggle--landing" />
          <Link to="/login" className="btn-ghost" style={{ display: "inline-block", padding: "8px 18px" }}>Sign in</Link>
          <Link to="/signup" className="btn-primary" style={{ display: "inline-block", padding: "8px 18px" }}>Get started</Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-badge">
          <span className="badge-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "inline-block", marginRight: 6 }}></span>
          <TypingText text="Powered by LangChain + GPT-4o" started={phase === 0} onComplete={() => setPhase(1)} />
        </div>
        <h1 className="hero-title">
          <TypingText text="Your AI bot " started={phase >= 1} onComplete={() => setPhase(2)} showCursor={phase === 1} />
          {phase >= 2 && (
            <span className="accent-text">
              <TypingText text="opens PRs" started={phase >= 2} onComplete={() => setPhase(3)} showCursor={phase === 2} />
            </span>
          )}
          <br />
          {phase >= 3 && <TypingText text="while you sleep." started={phase >= 3} onComplete={() => setPhase(4)} showCursor={phase === 3} />}
        </h1>
        <p className="hero-desc">
          <TypingText 
            text="Describe a code change in plain English. RepoMind clones the repository, applies the changes via AI, and opens a pull request — all as your configured bot user." 
            delay={15}
            started={phase >= 4}
            showCursor={phase === 4}
          />
        </p>
        <div className="hero-cta">
          <Link to="/signup" className="btn-primary hero-btn">Start for free →</Link>
          <Link to="/login" className="btn-ghost hero-btn">Sign in</Link>
        </div>

        <div className="hero-metrics">
          <div className="metric-card">
            <strong>24/7</strong>
            <span>Bot-ready automation</span>
          </div>
          <div className="metric-card">
            <strong>3 steps</strong>
            <span>From brief to PR</span>
          </div>
          <div className="metric-card">
            <strong>Live</strong>
            <span>Status and refinement</span>
          </div>
        </div>

        <div className="terminal-demo">
          <div className="terminal-bar">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
            <span className="terminal-title">repomind / new-job</span>
          </div>
          <div className="terminal-body">
            <div className="t-line"><span className="t-prompt">$</span> <span className="t-cmd">repomind run</span></div>
            <div className="t-line t-in">  <span className="t-key">repo_url:</span> <span className="t-val">https://github.com/acme/api-server</span></div>
            <div className="t-line t-in">  <span className="t-key">instruction:</span> <span className="t-val">"Refactor all DB calls to use async/await"</span></div>
            <div className="t-line t-gap"></div>
            <div className="t-line t-out"><span className="t-green">✓</span> Cloning repository...</div>
            <div className="t-line t-out"><span className="t-green">✓</span> Planning 6 steps with GPT-4o...</div>
            <div className="t-line t-out"><span className="t-green">✓</span> Applying changes to 8 files...</div>
            <div className="t-line t-out"><span className="t-green">✓</span> PR opened: <span className="t-link">github.com/acme/api-server/pull/47</span></div>
          </div>
        </div>
      </section>

      <section className="features">
        {[
          { icon: "🤖", title: "Bot creates PRs", desc: "A dedicated bot account (your SENDROOM config) opens every pull request — clean audit trail, no personal token exposed." },
          { icon: "🧠", title: "LangChain Agent", desc: "Multi-step planner breaks your instruction into atomic edits. Executor applies them with full file context via GPT-4o." },
          { icon: "🔁", title: "Refine & iterate", desc: "Send follow-up instructions to refine the same PR. The agent remembers what it already did in the session." },
          { icon: "📡", title: "Live status", desc: "Poll job status in real-time. See diffs, PR links, and step summaries as the agent works." },
        ].map((f) => (
          <div className="feature-card" key={f.title}>
            <div className="feature-line"></div>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>


      <footer className="landing-footer">
        <span>RepoMind — HackingTheRepo Team</span>
        <span style={{ color: "var(--text3)" }}>MIT License</span>
      </footer>
    </div>
  );
}
