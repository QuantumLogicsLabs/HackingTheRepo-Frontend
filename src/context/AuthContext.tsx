import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import api from "../utils/api";
import type {
  ApiErrorResponse,
  AuthResponse,
  AuthUser,
  LocalUser,
} from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (
    username: string,
    email: string,
    password: string,
  ) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  user: "rm_user",
  users: "rm_users",
};

const DEMO_USER: LocalUser = {
  id: "demo-user",
  username: "Demo User",
  email: "demo@repomind.dev",
  password: "demo1234",
  role: "user",
};

const DEMO_ADMIN: LocalUser = {
  id: "admin-user",
  username: "Admin User",
  email: "admin@repomind.dev",
  password: "admin1234",
  role: "admin",
};

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

function stripSensitive(
  user: (AuthUser & { password?: string }) | null | undefined,
): AuthUser | null {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

function ensureLocalUsers(): LocalUser[] {
  const storedUsers = readJson<LocalUser[] | null>(STORAGE_KEYS.users, null);
  if (Array.isArray(storedUsers) && storedUsers.length > 0) {
    return storedUsers;
  }

  const seededUsers = [DEMO_USER, DEMO_ADMIN];
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
          api.defaults.headers.common["Authorization"] = "Bearer local-session";
          setUser(cachedUser);
          return;
        }

        localStorage.removeItem(STORAGE_KEYS.user);
        delete api.defaults.headers.common["Authorization"];
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const nextUser = stripSensitive(data.user as LocalUser | AuthUser);
      if (nextUser) {
        writeJson(STORAGE_KEYS.user, nextUser);
        setUser(nextUser);
      }
      return { ...data, user: nextUser };
    } catch (error: unknown) {
      if (!shouldUseLocalFallback(error)) throw error;

      const localUsers = ensureLocalUsers();
      const match = localUsers.find(
        (account) =>
          account.email.toLowerCase() === email.toLowerCase() &&
          account.password === password,
      );

      if (!match) {
        throw new Error(
          "Use demo@repomind.dev / demo1234, or create a local account on the signup screen.",
        );
      }

      const nextUser = stripSensitive(match);
      writeJson(STORAGE_KEYS.user, nextUser);
      api.defaults.headers.common["Authorization"] = "Bearer local-session";
      setUser(nextUser);
      return { token: `local-${match.id}`, user: nextUser };
    }
  };

  const signup = async (
    username: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    try {
      const { data } = await api.post("/auth/signup", {
        username,
        email,
        password,
      });
      const nextUser = stripSensitive(data.user as LocalUser | AuthUser);
      if (nextUser) {
        writeJson(STORAGE_KEYS.user, nextUser);
        setUser(nextUser);
      }
      return { ...data, user: nextUser };
    } catch (error: unknown) {
      if (!shouldUseLocalFallback(error)) throw error;

      const localUsers = ensureLocalUsers();
      const emailTaken = localUsers.some(
        (account) => account.email.toLowerCase() === email.toLowerCase(),
      );
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
      writeJson(STORAGE_KEYS.user, stripSensitive(nextUser));
      api.defaults.headers.common["Authorization"] = "Bearer local-session";
      setUser(stripSensitive(nextUser));
      return { token: `local-${nextUser.id}`, user: stripSensitive(nextUser) };
    }
  };

  const logout = (): void => {
    localStorage.removeItem(STORAGE_KEYS.user);
    api.post("/auth/logout").catch(() => {
      // ignore logout failures; clear client-side state anyway
    });
    delete api.defaults.headers.common["Authorization"];
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
      value={{ user, loading, login, signup, logout, refreshUser }}
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
