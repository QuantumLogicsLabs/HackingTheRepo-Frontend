import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  token: "rm_token",
  user: "rm_user",
  users: "rm_users",
};

const DEMO_USER = {
  id: "demo-user",
  username: "Demo User",
  email: "demo@repomind.dev",
  password: "demo1234",
};

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function stripSensitive(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

function ensureLocalUsers() {
  const storedUsers = readJson(STORAGE_KEYS.users, null);
  if (Array.isArray(storedUsers) && storedUsers.length > 0) {
    return storedUsers;
  }

  const seededUsers = [DEMO_USER];
  writeJson(STORAGE_KEYS.users, seededUsers);
  return seededUsers;
}

function shouldUseLocalFallback(error) {
  return !error?.response || error.response.status >= 500;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    const cachedUser = readJson(STORAGE_KEYS.user, null);
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      api.get("/auth/me")
        .then((r) => {
          const nextUser = stripSensitive(r.data);
          if (nextUser) {
            writeJson(STORAGE_KEYS.user, nextUser);
            setUser(nextUser);
          }
        })
        .catch((error) => {
          if (shouldUseLocalFallback(error) && cachedUser) {
            api.defaults.headers.common["Authorization"] = "Bearer local-session";
            setUser(cachedUser);
            return;
          }

          localStorage.removeItem(STORAGE_KEYS.token);
          localStorage.removeItem(STORAGE_KEYS.user);
          delete api.defaults.headers.common["Authorization"];
        })
        .finally(() => setLoading(false));
    } else {
      if (cachedUser) {
        api.defaults.headers.common["Authorization"] = "Bearer local-session";
        setUser(cachedUser);
      }
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const nextUser = stripSensitive(data.user);
      localStorage.setItem(STORAGE_KEYS.token, data.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      if (nextUser) {
        writeJson(STORAGE_KEYS.user, nextUser);
        setUser(nextUser);
      }
      return { ...data, user: nextUser };
    } catch (error) {
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

      const nextUser = stripSensitive(match);
      localStorage.setItem(STORAGE_KEYS.token, `local-${match.id}`);
      writeJson(STORAGE_KEYS.user, nextUser);
      api.defaults.headers.common["Authorization"] = "Bearer local-session";
      setUser(nextUser);
      return { token: `local-${match.id}`, user: nextUser };
    }
  };

  const signup = async (username, email, password) => {
    try {
      const { data } = await api.post("/auth/signup", { username, email, password });
      const nextUser = stripSensitive(data.user);
      localStorage.setItem(STORAGE_KEYS.token, data.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      if (nextUser) {
        writeJson(STORAGE_KEYS.user, nextUser);
        setUser(nextUser);
      }
      return { ...data, user: nextUser };
    } catch (error) {
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
      localStorage.setItem(STORAGE_KEYS.token, `local-${nextUser.id}`);
      writeJson(STORAGE_KEYS.user, stripSensitive(nextUser));
      api.defaults.headers.common["Authorization"] = "Bearer local-session";
      setUser(stripSensitive(nextUser));
      return { token: `local-${nextUser.id}`, user: stripSensitive(nextUser) };
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get("/auth/me");
      const nextUser = stripSensitive(data);
      if (nextUser) {
        writeJson(STORAGE_KEYS.user, nextUser);
        setUser(nextUser);
      }
      return nextUser;
    } catch (error) {
      if (shouldUseLocalFallback(error)) {
        const cachedUser = readJson(STORAGE_KEYS.user, null);
        if (cachedUser) {
          setUser(cachedUser);
          return cachedUser;
        }
      }

      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
