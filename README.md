# HackingTheRepo — Frontend

> React SPA (Vite) that lets users submit AI-powered code-refactoring jobs, track their status in real time, and view the resulting GitHub PRs — all with a polished dark/light theming system.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Pages & Routes](#pages--routes)
- [Context & State](#context--state)
- [API Integration](#api-integration)
- [Scripts](#scripts)
- [Upgrade Roadmap](#upgrade-roadmap)

---

## Tech Stack

| Layer      | Tool                                        | Version |
| ---------- | ------------------------------------------- | ------- |
| Build tool | Vite                                        | 5.x     |
| UI Library | React                                       | 18.x    |
| Routing    | React Router DOM                            | 6.x     |
| HTTP       | Custom `fetch` wrapper (`src/utils/api.js`) | —       |
| Styling    | Vanilla CSS + CSS custom properties         | —       |
| Auth state | React Context API                           | —       |
| Theme      | React Context + `data-theme` attribute      | —       |
| Deployment | Vercel / GitHub Pages                       | —       |

---

## Architecture Overview

```
src/
├── context/
│   ├── AuthContext       ← Global user session + JWT token
│   └── ThemeContext       ← dark / light toggle persisted in localStorage
├── pages/
│   ├── LandingPage       ← Public marketing page
│   ├── AuthPages         ← Shared login/signup shell
│   ├── LoginPage         ← Login form
│   ├── SignupPage         ← Signup form
│   ├── DashboardPage     ← Job list + stats
│   ├── NewJobPage        ← Submit a new AI job
│   ├── JobDetailPage     ← Job status, PR link, refinement
│   └── SettingsPage      ← GitHub token + OpenAI key
The frontend will proxy `/api/*` to the auth backend during development.

### Encrypted secrets at rest

The local auth backend can encrypt sensitive values (GitHub tokens and OpenAI keys) before persisting them to `auth-data.json`. To enable AES-256-GCM encryption set the `REPOMIND_ENCRYPTION_KEY` environment variable when starting the server. The key must be 32 bytes (provide as base64 or hex).

Generate a key with OpenSSL:

```bash
# base64 (recommended)
openssl rand -base64 32

# or hex
openssl rand -hex 32
```

Start the backend with the key:

```bash
REPOMIND_ENCRYPTION_KEY=<base64-or-hex-key> GITHUB_CLIENT_ID=... GITHUB_CLIENT_SECRET=... npm run dev:api
```
    ├── Layout            ← Sidebar nav + main content wrapper
    ├── StatusBadge       ← Coloured pill for job status
    └── ThemeToggle       ← Dark/light switch button
```

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx / Layout.css
│   │   ├── StatusBadge.jsx
│   │   └── ThemeToggle.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── pages/
│   │   ├── LandingPage.jsx / .css
│   │   ├── AuthPages.jsx / .css
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── DashboardPage.jsx / .css
│   │   ├── NewJobPage.jsx / .css
│   │   ├── JobDetailPage.jsx / .css
│   │   └── SettingsPage.jsx / .css
│   ├── utils/
│   │   └── api.js          # Thin fetch wrapper — sets Authorization header
│   ├── App.jsx             # Router + context providers
│   ├── main.jsx            # React DOM entry point
│   └── index.css           # Global CSS variables & reset
├── index.html
├── vite.config.js
└── .gitignore
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Backend running on `:5000` (see `/backend`)

### Install & Run

```bash
cd frontend
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

### Build for Production

```bash
npm run build      # outputs to /dist
npm run preview    # local preview of the production build
```

---

## Pages & Routes

| Path         | Component       | Auth Required |
| ------------ | --------------- | ------------- |
| `/`          | `LandingPage`   | ❌            |
| `/login`     | `LoginPage`     | ❌            |
| `/signup`    | `SignupPage`    | ❌            |
| `/dashboard` | `DashboardPage` | ✅            |
| `/jobs/new`  | `NewJobPage`    | ✅            |
| `/jobs/:id`  | `JobDetailPage` | ✅            |
| `/settings`  | `SettingsPage`  | ✅            |

---

## Context & State

### AuthContext

Provides `{ user, token, login, logout }` to the entire app. Token is stored in `localStorage` and injected into every API call via `api.js`.

### ThemeContext

Provides `{ theme, toggleTheme }`. Writes `data-theme="dark"|"light"` to `document.documentElement`, which drives all CSS custom property values in `index.css`.

---

## API Integration

All calls go through `src/utils/api.js` which:

1. Reads `VITE_API_URL` from environment (falls back to `http://localhost:5000`)
2. Attaches `Authorization: Bearer <token>` automatically
3. Throws on non-2xx responses with the server's `message` field

To point the app at a different backend:

```bash
# .env.local
VITE_API_URL=https://your-backend.vercel.app
```

### GitHub OAuth backend

This repo can also run a local auth backend that supports GitHub OAuth and settings persistence.
To start the backend server locally:

```bash
GITHUB_CLIENT_ID=<your-client-id> GITHUB_CLIENT_SECRET=<your-client-secret> npm run dev:api
```

Then start the frontend in another terminal:

```bash
npm run dev
```

The frontend will proxy `/api/*` to `http://localhost:5000` during development.

### Sentry monitoring

To enable frontend Sentry error tracking and performance tracing, add the browser-facing Sentry env vars:

```bash
VITE_SENTRY_DSN=https://<PUBLIC_KEY>@sentry.io/<PROJECT_ID>
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.25
VITE_SENTRY_RELEASE=frontend@1.0.0
```

For sourcemap upload during production builds, set the build-only Sentry variables in your CI environment. Do not commit these values to source control:

```bash
SENTRY_AUTH_TOKEN=┗ your sentry auth token
SENTRY_ORG=<your-org-slug>
SENTRY_PROJECT=<your-project-slug>
SENTRY_RELEASE=frontend@1.0.0
SENTRY_URL=https://sentry.io/   # optional
```

### Distributed tracing (OpenTelemetry)

This frontend is now instrumented for OpenTelemetry browser tracing. To enable it, set:

```bash
VITE_OTEL_TRACES_ENDPOINT=https://your-otel-collector.example.com/v1/traces
VITE_OTEL_SERVICE_NAME=repomind-frontend
VITE_OTEL_ENVIRONMENT=production
```

The browser will emit W3C trace context headers on outgoing API requests, so an Express backend and a FastAPI backend can continue the same distributed trace.

#### Backend requirements

- Express must accept `traceparent` / `baggage` headers, continue the active span, and forward the same trace headers to downstream services.
- FastAPI must also accept propagated headers and export spans to Jaeger/Tempo via OTLP.

Example backend setup:

- Express: `@opentelemetry/sdk-node`, `@opentelemetry/instrumentation-express`, `@opentelemetry/instrumentation-http`
- FastAPI: `opentelemetry-sdk`, `opentelemetry-instrumentation-fastapi`, `opentelemetry-exporter-otlp`

This repository only contains frontend browser instrumentation. The backend services must be instrumented separately to get full traces spanning Express → Repomind FastAPI.

### Prometheus metrics endpoint

This project now includes a local Prometheus-compatible metrics server for job throughput, queue depth, and API latency histograms.

Start the metrics collector in a separate terminal:

```bash
npm run metrics
```

Then start the frontend dev server normally:

```bash
npm run dev
```

The app proxies `/metrics` to the local collector, so Prometheus can scrape:

```text
http://localhost:3000/metrics
```

If your backend supports it, point `VITE_API_URL` at your API server and use job-related request telemetry for the job metrics.

---

```bash
npm run dev       # Hot-reloading dev server
npm run build     # Production bundle → /dist
npm run preview   # Serve /dist locally
npm run lint      # ESLint (if configured)
npm run test      # Vitest test suite
```

---
GitHub Actions runs tests, linting, and a production build on every pull request to `main` and every push to `main`.
Successful pushes to `main` are deployed to Vercel production automatically.

Required GitHub repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Optional GitHub repository variables used at build/deploy time:

- `VITE_API_URL`
- `VITE_SENTRY_DSN`
- `VITE_SENTRY_TRACES_SAMPLE_RATE`
- `VITE_OTEL_TRACES_ENDPOINT`
- `VITE_OTEL_SERVICE_NAME`

Optional GitHub repository secrets for Sentry sourcemap uploads:

- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

---

## Upgrade Roadmap

Planned improvements to evolve this Vite/React SPA into an industry-grade Next.js application.

---

### Phase 1 — Migrate to Next.js 15 (App Router)

> Estimated effort: 3–5 days

**Why Next.js?**

- Server-Side Rendering (SSR) for SEO on the landing page
- React Server Components (RSC) — fetch data on the server, ship zero JS for static UI
- Built-in API Routes — can co-locate lightweight BFF endpoints
- Image optimisation, font loading, and metadata API out of the box
- First-class Vercel deployment with edge middleware

**Migration Steps:**

```bash
# 1. Scaffold new Next.js app
npx create-next-app@latest frontend-next --typescript --tailwind --app

# 2. Map pages
# src/pages/LandingPage.jsx  → app/page.tsx          (Server Component, SSR)
# src/pages/DashboardPage    → app/dashboard/page.tsx (Client Component)
# src/pages/JobDetailPage    → app/jobs/[id]/page.tsx (Server Component + polling)
# src/pages/NewJobPage       → app/jobs/new/page.tsx  (Client Component)
# src/pages/SettingsPage     → app/settings/page.tsx  (Client Component)

# 3. Move AuthContext → use next-auth or a custom session provider
# 4. Replace React Router <Link> with next/link
# 5. Replace fetch wrapper with server actions or next/navigation
```

**New App Router Structure:**

```
app/
├── layout.tsx              ← Root layout (fonts, providers, nav)
├── page.tsx                ← Landing (Server Component)
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (app)/
│   ├── layout.tsx          ← Protected layout with sidebar
│   ├── dashboard/page.tsx
│   ├── jobs/
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   └── settings/page.tsx
└── api/
    └── health/route.ts     ← BFF proxy or liveness check
```

---

### Phase 2 — TypeScript

Convert all `.jsx` → `.tsx` and `.js` → `.ts`:

```bash
npm install -D typescript @types/react @types/node
npx tsc --init
```

Type all API response shapes:

```ts
// types/job.ts
export interface Job {
  _id: string;
  repoUrl: string;
  instruction: string;
  status: "queued" | "running" | "completed" | "failed" | "refined";
  prUrl: string | null;
  diffSummary: string | null;
  createdAt: string;
}
```

---

### Phase 3 — Tailwind CSS

Replace per-page `.css` files with **Tailwind** utility classes:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Keep CSS custom properties for theming — Tailwind and CSS variables work well together.

---

### Phase 4 — Component Library (shadcn/ui)

Add **shadcn/ui** for accessible, well-designed primitives:

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button badge card dialog input label
```

Replace hand-written `StatusBadge`, form inputs, and modals with shadcn components that come with full ARIA compliance and keyboard navigation.

---

### Phase 5 — Server State Management (TanStack Query)

Replace manual `useEffect` fetch loops + status polling with **TanStack Query**:

```bash
npm install @tanstack/react-query
```

```tsx
// Auto-refetch job status every 3 seconds until terminal state
const { data: job } = useQuery({
  queryKey: ["job", id],
  queryFn: () => fetchJobStatus(id),
  refetchInterval: (data) =>
    data?.status === "running" || data?.status === "queued" ? 3000 : false,
});
```

Benefits:

- Background refetching
- Stale-while-revalidate caching
- Optimistic updates for mutations
- DevTools (`@tanstack/react-query-devtools`)

---

### Phase 6 — Form Handling (React Hook Form + Zod)

Replace controlled-input boilerplate with **React Hook Form** + **Zod** validation:

```bash
npm install react-hook-form zod @hookform/resolvers
```

```tsx
const schema = z.object({
  repoUrl: z.string().url("Must be a valid GitHub URL"),
  instruction: z
    .string()
    .min(10, "Describe the change in at least 10 characters"),
});

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(schema),
});
```

---

### Phase 7 — Authentication (NextAuth.js / Auth.js)

Replace the manual JWT + localStorage pattern with **Auth.js v5**:

```bash
npm install next-auth@beta
```

Benefits:

- Secure HttpOnly cookie sessions (no token in localStorage)
- OAuth providers (GitHub login with one click)
- CSRF protection built in
- Session accessible in both Server and Client Components

---

### Phase 8 — Testing (Vitest + Testing Library + Playwright)

```bash
# Unit & integration
npm install -D vitest @testing-library/react @testing-library/user-event jsdom

# E2E
npm install -D @playwright/test
```

**Structure:**

```
tests/
├── unit/
│   ├── StatusBadge.test.tsx
│   └── api.test.ts
├── integration/
│   └── DashboardPage.test.tsx
└── e2e/
    ├── auth.spec.ts
    └── job-lifecycle.spec.ts
```

---

### Phase 9 — CI/CD (GitHub Actions)

Add `.github/workflows/frontend-ci.yml`:

```yaml
name: Frontend CI
on: [push, pull_request]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

---

### Phase 10 — Performance & Observability

| Tool                          | Purpose                                               |
| ----------------------------- | ----------------------------------------------------- |
| **next/image**                | Automatic WebP, lazy-loading, layout shift prevention |
| **next/font**                 | Self-hosted fonts with zero CLS                       |
| **Sentry** (`@sentry/nextjs`) | Frontend error tracking                               |
| **Vercel Analytics**          | Core Web Vitals, page-level performance               |
| **Vercel Speed Insights**     | Real-user monitoring (RUM)                            |
| **Lighthouse CI**             | Automated Lighthouse scores in PRs                    |

---

### Summary Roadmap

```
v1.0  ✅  Current (Vite + React + CSS, Context API, React Router)
v1.1  →  TypeScript migration
v1.2  →  Tailwind CSS + shadcn/ui component library
v1.3  →  TanStack Query for server state + smart polling
v1.4  →  React Hook Form + Zod client-side validation
v1.5  →  Next.js 15 App Router migration (SSR, RSC, metadata)
v1.6  →  Auth.js v5 (HttpOnly cookies, GitHub OAuth)
v2.0  →  Vitest + Playwright test suite (>80% coverage)
v2.1  →  GitHub Actions CI/CD + Lighthouse CI
v2.2  →  Sentry + Vercel Analytics + Speed Insights
```
