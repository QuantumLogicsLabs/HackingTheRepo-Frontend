import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import api, { USER_KEY, clearSession } from "../utils/api";
import type { ApiErrorResponse, AuthResponse, AuthUser, LocalUser } from "../types";

interface GithubOAuthSettings {
  githubUsername: string;
  githubToken: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (username: string, email: string, password: string) => Promise<AuthResponse>;
  loginWithGithub: () => void;
  completeGithubLogin: (search: string) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  user: USER_KEY,
  users: "rm_users",
  githubOAuthState: "rm_github_oauth_state",
  pendingGithubSettings: "rm_pending_github_settings",
};

const DEMO_USER = {
  id: "demo-user",
  username: "Demo User",
  email: "demo@repomind.dev",
  password: "demo1234",
};

/** GitHub OAuth is enabled unless explicitly disabled. */
export const GITHUB_OAUTH_ENABLED =
  import.meta.env.VITE_GITHUB_OAUTH_ENABLED !== "false";

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getApiOrigin(): string {
  const baseURL = api.defaults.baseURL || "/api";
  return new URL(baseURL, window.location.origin).toString().replace(/\/$/, "");
}

function decodeJsonParam<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
}

function stripSensitive(
  user: (AuthUser & { password?: string }) | null | undefined
): AuthUser | null {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

/**
 * Caches the user object (non-sensitive) so the UI can paint instantly on
 * reload before /auth/me confirms the httpOnly cookie. This is just a
 * display cache now — the real session lives in the cookie, not here.
 */
function persistSession(user: AuthUser | null): void {
  if (user) {
    writeJson(STORAGE_KEYS.user, user);
  }
}

function ensureLocalUsers(): LocalUser[] {
  const storedUsers = readJson<LocalUser[] | null>(STORAGE_KEYS.users, null);
  if (Array.isArray(storedUsers) && storedUsers.length > 0) {
    return storedUsers;
  }

  const seededUsers = [DEMO_USER];
  writeJson(STORAGE_KEYS.users, seededUsers);
  return seededUsers;
}

function shouldUseLocalFallback(error: unknown): boolean {
  const apiError = error as ApiErrorResponse;
  return !apiError.response || (apiError.response.status ?? 0) >= 500;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cachedUser = readJson<AuthUser | null>(STORAGE_KEYS.user, null);

    // No local token to check anymore — the httpOnly cookie is invisible to
    // JS, so /auth/me is the only way to find out if we're actually logged in.
    api
      .get("/auth/me")
      .then((r) => {
        const nextUser = stripSensitive(r.data as AuthUser);
        if (nextUser) {
          writeJson(STORAGE_KEYS.user, nextUser);
          setUser(nextUser);
        }
      })
      .catch((error: unknown) => {
        if (shouldUseLocalFallback(error) && cachedUser) {
          // Backend unreachable (not just "not logged in") — use the cache.
          setUser(cachedUser);
          return;
        }

        // A real 401 means: no valid cookie, genuinely logged out.
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const nextUser = stripSensitive(data.user as LocalUser | AuthUser);
      persistSession(nextUser);
      setUser(nextUser);
      return { ...data, user: nextUser };
    } catch (error: unknown) {
      if (!shouldUseLocalFallback(error)) throw error;

      const localUsers = ensureLocalUsers();
      const match = localUsers.find(
        (account) =>
          account.email.toLowerCase() === email.toLowerCase() &&
          account.password === password
      );

      if (!match) {
        throw new Error("Use demo@repomind.dev / demo1234, or create a local account on the signup screen.");
      }

      const safeUser = stripSensitive(match);
      const token = `local-${match.id}`;
      persistSession(safeUser);
      setUser(safeUser);
      return { token, user: safeUser };
    }
  };

  const signup = async (
    username: string,
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      const { data } = await api.post("/auth/signup", { username, email, password });
      const nextUser = stripSensitive(data.user as LocalUser | AuthUser);
      persistSession(nextUser);
      setUser(nextUser);
      return { ...data, user: nextUser };
    } catch (error: unknown) {
      if (!shouldUseLocalFallback(error)) throw error;

      const localUsers = ensureLocalUsers();
      const emailTaken = localUsers.some((account) => account.email.toLowerCase() === email.toLowerCase());
      if (emailTaken) {
        throw new Error("An account with that email already exists locally.");
      }

      const nextUser = {
        id: `local-${Date.now().toString(36)}`,
        username,
        email,
        password,
      };

      localUsers.push(nextUser);
      writeJson(STORAGE_KEYS.users, localUsers);
      const token = `local-${nextUser.id}`;
      const safeUser = stripSensitive(nextUser);
      // IMPORTANT: use safeUser here, not nextUser — nextUser still has the
      // plaintext password on it, and we never want that in state/localStorage.
      persistSession(safeUser);
      setUser(safeUser);
      return { token, user: safeUser };
    }
  };

  const persistGithubSettings = async (
    githubUsername?: string,
    githubToken?: string
  ): Promise<void> => {
    if (!githubUsername && !githubToken) return;

    const pendingSettings: GithubOAuthSettings = {
      githubUsername: githubUsername ?? "",
      githubToken: githubToken ?? "",
    };
    writeJson(STORAGE_KEYS.pendingGithubSettings, pendingSettings);

    if (!githubToken) return;

    try {
      await api.put("/settings", {
        githubUsername: githubUsername ?? "",
        githubToken,
        openaiKey: "",
      });
      localStorage.removeItem(STORAGE_KEYS.pendingGithubSettings);
    } catch {
      // Keep pending settings so Settings can apply them after the session is ready.
    }
  };

  const loginWithGithub = (): void => {
    if (!GITHUB_OAUTH_ENABLED) {
      throw new Error("GitHub OAuth is not enabled yet.");
    }

    const state = crypto.randomUUID();
    sessionStorage.setItem(STORAGE_KEYS.githubOAuthState, state);

    const callbackUrl = `${window.location.origin}/auth/github/callback`;
    const githubLoginUrl = new URL(`${getApiOrigin()}/auth/github`);
    githubLoginUrl.searchParams.set("redirect_uri", callbackUrl);
    githubLoginUrl.searchParams.set("state", state);

    window.location.assign(githubLoginUrl.toString());
  };

  const completeGithubLogin = async (search: string): Promise<AuthResponse> => {
    const params = new URLSearchParams(search);
    const error = params.get("error");
    if (error) {
      throw new Error(params.get("error_description") || error);
    }

    const returnedState = params.get("state");
    const expectedState = sessionStorage.getItem(STORAGE_KEYS.githubOAuthState);
    if (expectedState && returnedState && returnedState !== expectedState) {
      throw new Error("GitHub sign-in state did not match. Please try again.");
    }
    sessionStorage.removeItem(STORAGE_KEYS.githubOAuthState);

    let data: AuthResponse;
    const code = params.get("code");
    if (code) {
      const response = await api.post<AuthResponse>("/auth/github/callback", {
        code,
        state: returnedState,
        redirectUri: `${window.location.origin}/auth/github/callback`,
      });
      data = response.data;
    } else {
      const userPayload = decodeJsonParam<AuthUser>(params.get("user"));
      if (!userPayload) {
        throw new Error("GitHub sign-in response was missing a user session.");
      }
      data = {
        user: userPayload,
        githubUsername: params.get("githubUsername") || userPayload.githubUsername,
        githubToken: params.get("githubToken") || undefined,
      };
    }

    const nextUser = stripSensitive(data.user as LocalUser | AuthUser);
    persistSession(nextUser);
    setUser(nextUser);

    await persistGithubSettings(data.githubUsername, data.githubToken);
    return { ...data, user: nextUser };
  };

  const logout = (): void => {
    void api.post("/auth/logout").catch(() => {});
    clearSession();
    setUser(null);
  };

  const refreshUser = async (): Promise<AuthUser | null> => {
    try {
      const { data } = await api.get("/auth/me");
      const nextUser = stripSensitive(data as AuthUser);
      if (nextUser) {
        writeJson(STORAGE_KEYS.user, nextUser);
        setUser(nextUser);
      }
      return nextUser;
    } catch (error) {
      if (shouldUseLocalFallback(error)) {
        const cachedUser = readJson<AuthUser | null>(STORAGE_KEYS.user, null);
        if (cachedUser) {
          setUser(cachedUser);
          return cachedUser;
        }
      }

      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        loginWithGithub,
        completeGithubLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};