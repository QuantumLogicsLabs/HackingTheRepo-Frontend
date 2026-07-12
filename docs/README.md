# RepoMind — Frontend

> A React + TypeScript SPA that lets users submit AI-powered code-refactoring jobs, track their status in real time, and view the resulting GitHub Pull Requests — wrapped in a polished dark/light theming system.

![React](https://img.shields.io/badge/React-18.x-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646cff?logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-6.x-ca4245?logo=reactrouter&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Pages & Routes](#pages--routes)
- [Context & State](#context--state)
- [API Integration](#api-integration)
- [Theming](#theming)
- [Scripts](#scripts)
- [Upgrade Roadmap](#upgrade-roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

RepoMind is an AI PR bot dashboard. Users connect their GitHub credentials, submit a repository URL along with a plain-English refactoring instruction, and the backend queues an AI agent that opens a pull request. This frontend polls for job status and surfaces the PR link, diff summary, and any refinement history once the job completes.

**Key features:**

- Submit and track AI code-refactoring jobs
- Real-time status polling (`queued → running → completed / failed / refined`)
- View generated PR links and diff summaries
- Offline / demo mode — works without a live backend via `localStorage` fallback
- Dark and light themes with zero flash on first paint
- Fully typed with TypeScript

---

## Tech Stack

| Layer         | Tool                                   | Version |
| ------------- | -------------------------------------- | ------- |
| Build tool    | [Vite](https://vitejs.dev)             | 5.x     |
| UI Library    | [React](https://react.dev)             | 18.x    |
| Language      | TypeScript                             | 5.x     |
| Routing       | [React Router DOM](https://reactrouter.com) | 6.x |
| HTTP client   | [Axios](https://axios-http.com) (`src/utils/api.ts`) | 1.x |
| Styling       | Vanilla CSS + CSS custom properties    | —       |
| Auth state    | React Context API                      | —       |
| Theme         | React Context + `data-theme` attribute | —       |
| Deployment    | Vercel / GitHub Pages                  | —       |

---

## Architecture Overview

```
src/
├── context/
│   ├── AuthContext.tsx    ← Global user session + JWT; offline fallback via localStorage
│   └── ThemeContext.tsx   ← dark / light toggle persisted in localStorage
├── pages/
│   ├── LandingPage        ← Public marketing page
│   ├── AuthPages          ← Shared login/signup shell
│   ├── LoginPage          ← Login form
│   ├── SignupPage         ← Signup form
│   ├── DashboardPage      ← Job list + stats
│   ├── NewJobPage         ← Submit a new AI job
│   ├── JobDetailPage      ← Job status, PR link, diff, refinement history
│   └── SettingsPage       ← GitHub token + OpenAI key management
└── components/
    ├── Layout             ← Sidebar nav + main content wrapper
    ├── StatusBadge        ← Coloured pill for job status
    └── ThemeToggle        ← Dark / light switch button
```

**Route guards:** `PrivateRoute` redirects unauthenticated users to `/login`. `PublicRoute` redirects authenticated users away from `/login` and `/signup` to `/dashboard`.

**Offline mode:** When the backend is unreachable (network error or 5xx), `AuthContext` falls back to a `localStorage`-backed user store. A seeded demo account (`demo@repomind.dev` / `demo1234`) is available out of the box so the UI can be explored without any backend.

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.css
│   │   ├── Layout.tsx
│   │   ├── StatusBadge.tsx
│   │   └── ThemeToggle.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── pages/
│   │   ├── AuthPage.css
│   │   ├── AuthPages.tsx
│   │   ├── DashboardPage.css
│   │   ├── DashboardPage.tsx
│   │   ├── JobDetailPage.css
│   │   ├── JobDetailPage.tsx
│   │   ├── LandingPage.css
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── NewJobPage.css
│   │   ├── NewJobPage.tsx
│   │   ├── SettingsPage.css
│   │   ├── SettingsPage.tsx
│   │   └── SignupPage.tsx
│   ├── utils/
│   │   └── api.ts          ← Axios instance; baseURL /api, 30s timeout
│   ├── App.tsx             ← Router + context providers + route guards
│   ├── index.css           ← Global design tokens & CSS reset
│   ├── main.tsx            ← React DOM entry point
│   ├── types.ts            ← Shared TypeScript interfaces & types
│   └── vite-env.d.ts
├── index.html
├── package.json
├── vite.config.js
└── .gitignore
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 (comes with Node 18)
- Backend API running on `:5000` — see the `/backend` README. The app also works in offline/demo mode if the backend is unavailable.

### Install & Run

```bash
# 1. Clone the repository
git clone https://github.com/your-org/HackingTheRepo.git
cd HackingTheRepo/frontend

# 2. Install dependencies
npm install

# 3. Start the dev server (http://localhost:3000)
npm run dev
```

> **Tip:** If you only want to explore the UI without a backend, log in with the built-in demo account:
> - Email: `demo@repomind.dev`
> - Password: `demo1234`

### Build for Production

```bash
npm run build      # Outputs to /dist
npm run preview    # Serves /dist locally for verification
```

---

## Environment Variables

Create a `.env.local` file in the `frontend/` directory to override defaults:

```bash
# .env.local
VITE_API_URL=https://your-backend.example.com
```

| Variable       | Default                  | Description                              |
| -------------- | ------------------------ | ---------------------------------------- |
| `VITE_API_URL` | `http://localhost:5000`  | Base URL of the RepoMind backend API     |

All Vite env variables must be prefixed with `VITE_` to be exposed to the browser bundle.

---

## Pages & Routes

| Path         | Component       | Auth Required | Description                        |
| ------------ | --------------- | :-----------: | ---------------------------------- |
| `/`          | `LandingPage`   | ❌            | Public marketing / hero page       |
| `/login`     | `LoginPage`     | ❌            | Email + password login             |
| `/signup`    | `SignupPage`    | ❌            | New account registration           |
| `/dashboard` | `DashboardPage` | ✅            | Job list, stats, quick actions     |
| `/jobs/new`  | `NewJobPage`    | ✅            | Submit a new AI refactoring job    |
| `/jobs/:id`  | `JobDetailPage` | ✅            | Job status, PR link, diff, history |
| `/settings`  | `SettingsPage`  | ✅            | GitHub token + OpenAI key          |
| `*`          | —               | —             | Redirects to `/`                   |

---

## Context & State

### `AuthContext`

Located at `src/context/AuthContext.tsx`. Provides the following to the entire component tree:

| Value          | Type                                          | Description                                  |
| -------------- | --------------------------------------------- | -------------------------------------------- |
| `user`         | `AuthUser \| null`                            | Currently authenticated user (stripped of password) |
| `loading`      | `boolean`                                     | `true` while the initial session check runs  |
| `login`        | `(email, password) => Promise<AuthResponse>`  | Authenticates; falls back to localStorage    |
| `signup`       | `(username, email, password) => Promise<...>` | Registers; falls back to localStorage        |
| `logout`       | `() => void`                                  | Clears token and user from state + storage   |
| `refreshUser`  | `() => Promise<AuthUser \| null>`             | Re-fetches `/auth/me`; falls back to cache   |

**localStorage keys** used by `AuthContext`:

| Key        | Contents                          |
| ---------- | --------------------------------- |
| `rm_token` | JWT or `local-<id>` for offline   |
| `rm_user`  | Cached `AuthUser` object (JSON)   |
| `rm_users` | Local user registry (JSON array)  |

### `ThemeContext`

Located at `src/context/ThemeContext.tsx`. Provides:

| Value         | Type                              | Description                               |
| ------------- | --------------------------------- | ----------------------------------------- |
| `theme`       | `"light" \| "dark"`              | Current active theme                      |
| `setTheme`    | `Dispatch<SetStateAction<Theme>>` | Direct setter                             |
| `toggleTheme` | `() => void`                     | Switches between light and dark           |

On mount, `ThemeContext` reads `localStorage` → falls back to `prefers-color-scheme` → defaults to `"light"`. It uses `useLayoutEffect` to write `data-theme` onto `<html>` before the first paint, eliminating theme flash.

---

## API Integration

All HTTP calls go through `src/utils/api.ts`, which exports an Axios instance:

```ts
import axios from "axios";

const api = axios.create({
  baseURL: "/api",   // proxied to VITE_API_URL by Vite dev server
  timeout: 30000,
});

export default api;
```

The Vite dev server proxies `/api/*` to `http://localhost:5000` (configurable in `vite.config.js`). In production, point your hosting platform's rewrite rules at the same backend URL.

**Authentication header:** `AuthContext` sets `api.defaults.headers.common["Authorization"]` to `Bearer <token>` after login and deletes it on logout. Every subsequent request automatically carries the token.

**Error handling:** `AuthContext` inspects the Axios error — if there is no `response` (network down) or the status is ≥ 500, it treats it as a backend outage and falls back to the local user store. 4xx errors (wrong credentials, validation failures) are re-thrown so the calling component can display them.

---

## Theming

RepoMind uses a **"Minimal Luxury"** design language driven entirely by CSS custom properties defined in `src/index.css`. The active palette is toggled by setting `data-theme="light"` or `data-theme="dark"` on `<html>`.

**Design tokens include:**

- Background layers (`--bg` through `--bg5`)
- Border shades (`--border`, `--border2`, `--border3`)
- Text hierarchy (`--text`, `--text2`, `--text3`)
- Accent colour (`--accent`, `--accent2`, `--accent3`, `--accent-glow`)
- Semantic colours: `--red`, `--yellow`, `--purple`, `--teal`, `--orange`
- Typography: Inter (UI), JetBrains Mono (code)
- Shadows (`--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-accent`)
- Border radii (`--radius`, `--radius-md`, `--radius-lg`, `--radius-xl`)

Light mode uses a cool-blue palette; dark mode uses a deep charcoal base with a cyan AI accent (`#00d4ff`).

---

## Scripts

```bash
npm run dev       # Hot-reloading dev server on http://localhost:3000
npm run build     # Production bundle → /dist
npm run preview   # Serve /dist locally
```

---

## Upgrade Roadmap

Planned improvements to evolve this Vite/React SPA into an industry-grade application:

```
v1.0  ✅  Current — Vite + React + TypeScript + CSS, Context API, React Router
v1.1  →   Tailwind CSS + shadcn/ui component library
v1.2  →   TanStack Query for server state + smart polling
v1.3  →   React Hook Form + Zod client-side validation
v1.4  →   Next.js 15 App Router migration (SSR, RSC, metadata)
v1.5  →   Auth.js v5 (HttpOnly cookies, GitHub OAuth)
v2.0  →   Vitest + Playwright test suite (> 80 % coverage)
v2.1  →   GitHub Actions CI/CD + Lighthouse CI
v2.2  →   Sentry + Vercel Analytics + Speed Insights
```

See the detailed phase breakdown in [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) to learn about our development workflow, commit conventions, and how to open a pull request.

---

## License

This project is licensed under the [MIT License](LICENSE).
