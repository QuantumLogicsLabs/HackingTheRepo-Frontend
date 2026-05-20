import {
  useState,
  type FormEventHandler,
  type ReactElement,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const error = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return error.response?.data?.message || error.message || fallback;
}

export function LoginPage(): ReactElement {
  const { login } = useAuth();
  const { refreshUser } = useAuth();
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

  const handleGithubLogin = (): void => {
    const width = 720;
    const height = 700;
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);
    const params = new URLSearchParams({
      redirect_uri: window.location.origin + "/auth/github/callback",
    });
    const popup = window.open(
      `/api/auth/github?${params.toString()}`,
      "gh_oauth",
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    const onMessage = async (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      if (ev.data?.type === "github:auth:complete") {
        window.removeEventListener("message", onMessage);
        try {
          await refreshUser();
        } catch {}
        if (popup && !popup.closed) popup.close();
        navigate("/dashboard");
      }
    };

    window.addEventListener("message", onMessage);
  };

  return (
    <AuthLayout title="Welcome back" sub="Sign in to your RepoMind account">
      <div className="auth-hint">
        Demo account: <strong>demo@repomind.dev</strong> /{" "}
        <strong>demo1234</strong>
      </div>
      <form onSubmit={handle}>
        <div style={{ marginBottom: 12 }}>
          <button
            type="button"
            className="btn-github"
            onClick={handleGithubLogin}
          >
            Sign in with GitHub
          </button>
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        {error && <div className="auth-error">{error}</div>}
        <button
          type="submit"
          className="btn-primary auth-submit"
          disabled={loading}
        >
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
  const { signup, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<SignupForm>({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
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

  const handleGithubLogin = (): void => {
    const width = 720;
    const height = 700;
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);
    const params = new URLSearchParams({
      redirect_uri: window.location.origin + "/auth/github/callback",
    });
    const popup = window.open(
      `/api/auth/github?${params.toString()}`,
      "gh_oauth",
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    const onMessage = async (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      if (ev.data?.type === "github:auth:complete") {
        window.removeEventListener("message", onMessage);
        try {
          await refreshUser();
        } catch {}
        if (popup && !popup.closed) popup.close();
        navigate("/dashboard");
      }
    };

    window.addEventListener("message", onMessage);
  };

  return (
    <AuthLayout
      title="Create account"
      sub="Start automating your PRs with RepoMind"
    >
      <form onSubmit={handle}>
        <div style={{ marginBottom: 12 }}>
          <button
            type="button"
            className="btn-github"
            onClick={handleGithubLogin}
          >
            Continue with GitHub
          </button>
        </div>
        <div className="field">
          <label>Username</label>
          <input
            type="text"
            placeholder="yourname"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder="min 6 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        {error && <div className="auth-error">{error}</div>}
        <button
          type="submit"
          className="btn-primary auth-submit"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create account →"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

function AuthLayout({ title, sub, children }: AuthLayoutProps): ReactElement {
  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <Link to="/" className="auth-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
