import {
  useEffect,
  useState,
  type FormEventHandler,
  type ReactElement,
  type ReactNode,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import "./AuthPage.css";

interface LoginForm {
  email: string;
  password: string;
}

interface SignupForm extends LoginForm {
  username: string;
}

interface AuthLayoutProps {
  title: string;
  sub: string;
  children: ReactNode;
}

function getErrorMessage(err: unknown, fallback: string): string {
  const error = err as { response?: { data?: { message?: string } }; message?: string };
  return error.response?.data?.message || error.message || fallback;
}

export function LoginPage(): ReactElement {
  const { login, loginWithGithub } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" sub="Sign in to your RepoMind account">
      <div className="auth-hint">
        Demo account: <strong>demo@repomind.dev</strong> / <strong>demo1234</strong>
      </div>
      <GithubButton label="Continue with GitHub" onClick={loginWithGithub} />
      <div className="auth-divider">
        <span>or</span>
      </div>
      <form onSubmit={handle}>
        <div className="field">
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" placeholder="••••••••" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="btn-primary auth-submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in →"}
        </button>
      </form>
      <p className="auth-switch">
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </AuthLayout>
  );
}

export function SignupPage(): ReactElement {
  const { signup, loginWithGithub } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<SignupForm>({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await signup(form.username, form.email, form.password);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Signup failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" sub="Start automating your PRs with RepoMind">
      <GithubButton label="Sign up with GitHub" onClick={loginWithGithub} />
      <div className="auth-divider">
        <span>or</span>
      </div>
      <form onSubmit={handle}>
        <div className="field">
          <label>Username</label>
          <input type="text" placeholder="yourname" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" placeholder="min 6 characters" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="btn-primary auth-submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account →"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

export function GithubCallbackPage(): ReactElement {
  const { completeGithubLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    completeGithubLogin(location.search)
      .then(() => {
        if (!cancelled) navigate("/dashboard", { replace: true });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getErrorMessage(err, "GitHub sign-in failed"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [completeGithubLogin, location.search, navigate]);

  return (
    <AuthLayout title="Signing you in" sub="Completing GitHub authentication">
      {error ? (
        <>
          <div className="auth-error">{error}</div>
          <button
            type="button"
            className="btn-primary auth-submit"
            onClick={() => navigate("/login", { replace: true })}
          >
            Back to sign in
          </button>
        </>
      ) : (
        <div className="auth-loading-panel" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <span>Connecting GitHub...</span>
        </div>
      )}
    </AuthLayout>
  );
}

function GithubButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}): ReactElement {
  return (
    <button type="button" className="github-auth-btn" onClick={onClick}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
      <span>{label}</span>
    </button>
  );
}

function AuthLayout({ title, sub, children }: AuthLayoutProps): ReactElement {
  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <Link to="/" className="auth-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          RepoMind
        </Link>
        <ThemeToggle className="theme-toggle--auth" />
      </div>
      <div className="auth-card card fade-in">
        <h1 className="auth-title">{title}</h1>
        <p className="auth-sub">{sub}</p>
        {children}
      </div>
    </div>
  );
}
