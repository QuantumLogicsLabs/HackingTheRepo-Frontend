import express from "express";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const app = express();
app.use(express.json());

const dataFile = path.resolve("auth-data.json");
const port = Number(process.env.PORT) || 5000;
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const githubScope =
  process.env.GITHUB_OAUTH_SCOPE || "repo read:user user:email";

const defaultData = {
  users: [
    {
      id: "demo-user",
      username: "Demo User",
      email: "demo@repomind.dev",
      password: "demo1234",
      githubUsername: "",
      githubToken: "",
      openaiKey: "",
      role: "admin",
      totalJobs: 0,
      successfulPRs: 0,
    },
  ],
  jobs: [],
  sessions: {},
};

// Encryption helpers — AES-256-GCM
const ENC_KEY_ENV = process.env.REPOMIND_ENCRYPTION_KEY;
let ENC_KEY = null;
if (ENC_KEY_ENV) {
  try {
    // Try base64, then hex, then raw
    let buf = Buffer.from(ENC_KEY_ENV, "base64");
    if (buf.length !== 32) {
      buf = Buffer.from(ENC_KEY_ENV, "hex");
    }
    if (buf.length === 32) ENC_KEY = buf;
  } catch {
    try {
      const buf = Buffer.from(ENC_KEY_ENV, "hex");
      if (buf.length === 32) ENC_KEY = buf;
    } catch {
      ENC_KEY = null;
    }
  }
}

function encryptSecret(plain) {
  if (!plain) return "";
  if (!ENC_KEY) return plain; // fallback: store plaintext if no key provided
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv);
    const ct = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ct]).toString("base64");
  } catch (err) {
    return String(plain);
  }
}

function decryptSecret(stored) {
  if (!stored) return "";
  if (!ENC_KEY) return stored; // fallback: assume plaintext
  try {
    const buf = Buffer.from(stored, "base64");
    const iv = buf.slice(0, 12);
    const tag = buf.slice(12, 28);
    const ct = buf.slice(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
    return plain;
  } catch (err) {
    // If decryption fails, assume the stored value was plaintext
    return stored;
  }
}

const loadData = async () => {
  try {
    const raw = await fs.readFile(dataFile, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    await fs.writeFile(dataFile, JSON.stringify(defaultData, null, 2), "utf8");
    return JSON.parse(JSON.stringify(defaultData));
  }
};

const saveData = async (data) => {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), "utf8");
};

const data = await loadData();

const normalizeUser = (user) => {
  const { password: _password, githubToken: _gt, openaiKey: _ok, ...safeUser } = user;
  void _password;
  void _gt;
  void _ok;
  return safeUser;
};

const createToken = () => crypto.randomBytes(24).toString("hex");

const getUserSettings = (user) => ({
  githubUsername: user.githubUsername || "",
  // Never return secrets from settings endpoint — only indicate presence
  githubToken: "",
  openaiKey: "",
  hasGithubToken: Boolean(user.githubToken),
  hasOpenaiKey: Boolean(user.openaiKey),
});

const findUserByEmail = (email) =>
  data.users.find((user) => user.email.toLowerCase() === email.toLowerCase());

const findUserByGithubUsername = (githubUsername) =>
  data.users.find(
    (user) =>
      user.githubUsername?.toLowerCase() === githubUsername?.toLowerCase(),
  );

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;
  // If no Authorization header, try cookie 'rm_token'
  let finalToken = token;
  if (!finalToken && req.headers.cookie) {
    const cookies = Object.fromEntries(req.headers.cookie.split(/;\s*/).map(c => {
      const idx = c.indexOf('=');
      return [c.slice(0, idx), decodeURIComponent(c.slice(idx+1))];
    }));
    finalToken = cookies['rm_token'];
  }

  if (!finalToken) {
    return res.status(401).json({ message: "Missing authorization token" });
  }

  const session = data.sessions[finalToken];
  if (!session) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const user = data.users.find((item) => item.id === session.userId);
  if (!user) {
    return res.status(401).json({ message: "User session not found" });
  }

  req.user = user;
  req.sessionToken = finalToken;
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = createToken();
  data.sessions[token] = {
    userId: user.id,
    createdAt: new Date().toISOString(),
  };
  await saveData(data);

  // Set HttpOnly cookie for auth token (secure in production)
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
  res.cookie && res.cookie("rm_token", token, cookieOpts);

  // Also return user for client convenience (token sent via cookie)
  return res.json({
    user: normalizeUser(user),
    githubUsername: user.githubUsername || undefined,
    githubToken: user.githubToken ? decryptSecret(user.githubToken) : undefined,
  });
});

app.post("/auth/signup", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "Username, email, and password are required" });
  }

  if (findUserByEmail(email)) {
    return res
      .status(409)
      .json({ message: "An account with that email already exists" });
  }

  const id = `user-${crypto.randomBytes(8).toString("hex")}`;
  const user = {
    id,
    username,
    email,
    password,
    githubUsername: "",
    githubToken: "",
    openaiKey: "",
    role: "user", // Assign default role as user
    totalJobs: 0,
    successfulPRs: 0,
  };
  data.users.push(user);

  const token = createToken();
  data.sessions[token] = { userId: id, createdAt: new Date().toISOString() };
  await saveData(data);

  // Set HttpOnly cookie for auth token
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
  res.cookie && res.cookie("rm_token", token, cookieOpts);

  return res.json({ user: normalizeUser(user) });
});

app.get("/auth/me", authMiddleware, (req, res) => {
  return res.json(normalizeUser(req.user));
});

app.get("/settings", authMiddleware, (req, res) => {
  return res.json(getUserSettings(req.user));
});

app.put("/settings", authMiddleware, async (req, res) => {
  const { githubUsername, githubToken, openaiKey } = req.body;

  if (githubUsername !== undefined) {
    req.user.githubUsername = String(githubUsername || "");
  }

  if (githubToken !== undefined) {
    req.user.githubToken = githubToken ? encryptSecret(githubToken) : "";
  }

  if (openaiKey !== undefined) {
    req.user.openaiKey = openaiKey ? encryptSecret(openaiKey) : "";
  }

  await saveData(data);
  return res.json(getUserSettings(req.user));
});

// Jobs: users create jobs; admins can see all jobs
app.post("/jobs", authMiddleware, async (req, res) => {
  const { repoUrl, instruction } = req.body;
  if (!repoUrl || !instruction) {
    return res.status(400).json({ message: "repoUrl and instruction are required" });
  }

  const job = {
    id: `job-${crypto.randomBytes(8).toString("hex")}`,
    userId: req.user.id,
    repoUrl,
    instruction,
    status: "queued",
    createdAt: new Date().toISOString(),
  };
  data.jobs.push(job);
  await saveData(data);
  return res.status(201).json(job);
});

app.get("/jobs", authMiddleware, (req, res) => {
  if (req.user.role === "admin") {
    return res.json(data.jobs || []);
  }
  return res.json((data.jobs || []).filter((j) => j.userId === req.user.id));
});

app.get("/jobs/:id", authMiddleware, (req, res) => {
  const job = (data.jobs || []).find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (req.user.role !== "admin" && job.userId !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }
  return res.json(job);
});

// Admin: manage users
app.get("/admin/users", authMiddleware, requireAdmin, (req, res) => {
  return res.json(data.users.map((u) => normalizeUser(u)));
});

app.put("/admin/users/:id", authMiddleware, requireAdmin, async (req, res) => {
  const { role } = req.body;
  const allowed = ["admin", "user"];
  if (role !== undefined && !allowed.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  const user = data.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (role !== undefined) user.role = role;
  await saveData(data);
  return res.json(normalizeUser(user));
});

app.delete("/admin/users/:id", authMiddleware, requireAdmin, async (req, res) => {
  const idx = data.users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "User not found" });
  const [removed] = data.users.splice(idx, 1);
  // remove sessions
  for (const t of Object.keys(data.sessions)) {
    if (data.sessions[t].userId === removed.id) delete data.sessions[t];
  }
  await saveData(data);
  return res.status(204).end();
});

app.get("/auth/github", (req, res) => {
  if (!githubClientId || !githubClientSecret) {
    return res
      .status(500)
      .send(
        "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
      );
  }

  const redirectUri = String(req.query.redirect_uri || "");
  const state = String(req.query.state || "");
  if (!redirectUri || !state) {
    return res.status(400).send("redirect_uri and state are required");
  }

  const params = new URLSearchParams({
    client_id: githubClientId,
    redirect_uri: redirectUri,
    scope: githubScope,
    state,
    allow_signup: "true",
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

app.post("/auth/github/callback", async (req, res) => {
  if (!githubClientId || !githubClientSecret) {
    return res.status(500).json({ message: "GitHub OAuth is not configured." });
  }

  const { code, redirectUri } = req.body;
  if (!code || !redirectUri) {
    return res
      .status(400)
      .json({ message: "code and redirectUri are required" });
  }

  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: githubClientId,
        client_secret: githubClientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    },
  );

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    return res.status(400).json({
      message:
        tokenData.error_description ||
        tokenData.error ||
        "Failed to exchange GitHub code",
    });
  }

  const accessToken = tokenData.access_token;
  const githubResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "RepoMind-Frontend",
    },
  });

  if (!githubResponse.ok) {
    return res
      .status(502)
      .json({ message: "Failed to fetch GitHub user profile" });
  }

  const githubProfile = await githubResponse.json();
  let email = githubProfile.email;
  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "RepoMind-Frontend",
      },
    });

    if (emailsResponse.ok) {
      const emails = await emailsResponse.json();
      const primary = emails.find(
        (item) => item.primary && item.verified && item.email,
      );
      email = primary?.email || emails.find((item) => item.verified)?.email;
    }
  }

  const githubUsername = githubProfile.login;
  const normalizedEmail = email || `${githubUsername}@users.noreply.github.com`;

  let user =
    findUserByGithubUsername(githubUsername) ||
    findUserByEmail(normalizedEmail);
  if (!user) {
    const id = `user-${crypto.randomBytes(8).toString("hex")}`;
    user = {
      id,
      username: githubUsername,
      email: normalizedEmail,
      password: "",
      githubUsername,
      githubToken: encryptSecret(accessToken),
      openaiKey: "",
      totalJobs: 0,
      successfulPRs: 0,
    };
    data.users.push(user);
  } else {
    user.githubUsername = githubUsername;
    user.githubToken = encryptSecret(accessToken);
    user.email = normalizedEmail;
  }

  const token = createToken();
  data.sessions[token] = {
    userId: user.id,
    createdAt: new Date().toISOString(),
  };
  await saveData(data);

  // Set HttpOnly cookie for auth token
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
  res.cookie && res.cookie("rm_token", token, cookieOpts);

  return res.json({ user: normalizeUser(user), githubUsername });
});

app.get("/health", (_req, res) => {
  res.send("ok");
});

// Logout: clear session and cookie
app.post("/auth/logout", (req, res) => {
  // find token from cookie or header
  const authHeader = req.headers.authorization || "";
  let token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  if (!token && req.headers.cookie) {
    const cookies = Object.fromEntries(req.headers.cookie.split(/;\s*/).map(c => {
      const idx = c.indexOf('=');
      return [c.slice(0, idx), decodeURIComponent(c.slice(idx+1))];
    }));
    token = cookies['rm_token'];
  }
  if (token && data.sessions[token]) delete data.sessions[token];
  // clear cookie
  if (res.clearCookie) {
    res.clearCookie('rm_token', { path: '/' });
  } else {
    res.setHeader('Set-Cookie', 'rm_token=; Max-Age=0; Path=/; HttpOnly');
  }
  saveData(data).catch(() => {});
  return res.status(204).end();
});

app.listen(port, () => {
  console.log(`Auth server listening on http://localhost:${port}`);
  console.log(
    "Use GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to enable GitHub OAuth.",
  );
});
