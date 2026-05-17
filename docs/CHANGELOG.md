# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Tailwind CSS + shadcn/ui component library
- TanStack Query for server state and smart status polling
- React Hook Form + Zod client-side validation
- Next.js 15 App Router migration (SSR, React Server Components)
- Auth.js v5 — HttpOnly cookie sessions, GitHub OAuth
- Vitest + Playwright test suite (> 80% coverage)
- GitHub Actions CI/CD pipeline + Lighthouse CI
- Sentry error tracking + Vercel Analytics

---

## [1.0.0] — 2024-01-01

### Added
- Initial release of the RepoMind frontend SPA
- `LandingPage` — public marketing / hero page
- `LoginPage` and `SignupPage` with form validation and error display
- `DashboardPage` — job list with status badges and summary stats
- `NewJobPage` — form to submit a repo URL and refactoring instruction
- `JobDetailPage` — real-time job status polling, PR link, diff summary, refinement history
- `SettingsPage` — GitHub token and OpenAI API key management
- `AuthContext` — JWT session management with `localStorage` persistence and offline fallback
- `ThemeContext` — dark / light theme toggle persisted in `localStorage`, driven by CSS custom properties
- `Layout` component — sticky sidebar navigation with active-link highlighting
- `StatusBadge` component — colour-coded pill for `queued | running | completed | failed | refined`
- `ThemeToggle` component — accessible dark/light switch used in sidebar and auth pages
- "Minimal Luxury" design system — CSS custom properties for colour, typography, spacing, and shadow
- Offline / demo mode — works without a live backend via `localStorage` user store
- Seeded demo account: `demo@repomind.dev` / `demo1234`
- Vite dev server proxy — `/api/*` forwarded to `http://localhost:5000`
- Fully typed with TypeScript (`src/types.ts` exports all shared interfaces)
- `prefers-reduced-motion` support — all animations disabled when requested
- Responsive layout — sidebar collapses to top nav on viewports ≤ 980px

### Fixed
- `index.html` entry point corrected from `main.jsx` to `main.tsx`

---

[Unreleased]: https://github.com/your-org/HackingTheRepo/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-org/HackingTheRepo/releases/tag/v1.0.0
