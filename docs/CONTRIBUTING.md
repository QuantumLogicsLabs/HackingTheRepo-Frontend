# Contributing to RepoMind — Frontend

Thank you for taking the time to contribute! This document covers everything you need to know — from setting up your local environment to getting your pull request merged.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Convention](#commit-convention)
- [Branch Naming](#branch-naming)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Upgrade Roadmap Contributions](#upgrade-roadmap-contributions)

---

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to uphold it. Please report unacceptable behaviour to the maintainers.

---

## Getting Started

1. **Fork** the repository and clone your fork:

   ```bash
   git clone https://github.com/<your-username>/HackingTheRepo.git
   cd HackingTheRepo/frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the dev server:**

   ```bash
   npm run dev   # http://localhost:3000
   ```

4. **Create a `.env.local`** if you want to point at a real backend:

   ```bash
   VITE_API_URL=http://localhost:5000
   ```

   Otherwise the app works in offline/demo mode automatically.

---

## Development Workflow

```
main           ← stable, protected — direct pushes disallowed
  └─ dev       ← integration branch — PRs target this branch
       └─ feature/my-thing
       └─ fix/broken-nav
       └─ chore/update-deps
```

1. Branch off `dev` (never directly off `main`).
2. Make focused, atomic commits.
3. Open a PR against `dev`.
4. A maintainer reviews, requests changes if needed, then merges.
5. `dev` is periodically merged into `main` for releases.

---

## Commit Convention

We follow **[Conventional Commits](https://www.conventionalcommits.org/)**:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

**Types:**

| Type       | When to use                                          |
| ---------- | ---------------------------------------------------- |
| `feat`     | A new feature visible to users                       |
| `fix`      | A bug fix                                            |
| `docs`     | Documentation only changes                           |
| `style`    | Formatting, whitespace — no logic change             |
| `refactor` | Code change that is neither a fix nor a feature      |
| `perf`     | A change that improves performance                   |
| `test`     | Adding or correcting tests                           |
| `chore`    | Build process, dependency updates, tooling           |
| `ci`       | CI configuration changes                             |

**Examples:**

```
feat(dashboard): add job count badge to sidebar nav
fix(auth): clear rm_token on 401 response
docs(readme): correct dev server port to 3000
chore(deps): bump axios from 1.7.2 to 1.8.0
```

Keep the subject line under 72 characters. Use the body to explain *why*, not *what*.

---

## Branch Naming

```
feat/<short-description>      → feat/job-status-polling
fix/<short-description>       → fix/theme-flash-on-reload
chore/<short-description>     → chore/update-vite-5
docs/<short-description>      → docs/add-env-variable-table
refactor/<short-description>  → refactor/auth-context-cleanup
```

Use lowercase kebab-case. Keep names short and descriptive.

---

## Pull Request Guidelines

- **Target branch:** always `dev`, never `main`.
- **One concern per PR** — avoid bundling unrelated changes.
- Fill out the PR template completely.
- Link any related issues with `Closes #<issue-number>`.
- Make sure `npm run build` passes locally before opening the PR.
- Add or update relevant documentation if your change affects public-facing behaviour.
- Keep the diff as small as possible — reviewers will thank you.

**PR title format:** same as commit convention — e.g. `feat(jobs): add retry button on failed jobs`.

---

## Coding Standards

### TypeScript

- All new files must be `.tsx` (components) or `.ts` (utilities, types).
- Avoid `any` — prefer `unknown` and narrow with type guards.
- Export shared interfaces and types from `src/types.ts`.
- Use `interface` for object shapes and `type` for unions / aliases.

### React

- Functional components only — no class components.
- Colocate a component's CSS file next to its `.tsx` file (e.g. `Layout.tsx` + `Layout.css`).
- Use the existing `useAuth()` and `useTheme()` hooks — do not consume contexts directly.
- Do not introduce new global state patterns without discussion.

### CSS

- Use the design tokens defined in `src/index.css` (`--accent`, `--bg`, `--text`, etc.). Do not hardcode colours.
- Follow the existing BEM-ish class naming used in the project.
- Do not add inline styles for anything other than dynamic values.

### General

- Remove all `console.log` calls before opening a PR.
- Do not commit `.env` or `.env.local` files.
- Keep components focused — if a file grows past ~300 lines, consider splitting it.

---

## Reporting Bugs

Before filing a bug, please check [existing issues](https://github.com/your-org/HackingTheRepo/issues) to avoid duplicates.

When you open a bug report, include:

1. A clear, descriptive title.
2. Steps to reproduce (numbered list).
3. Expected behaviour vs. actual behaviour.
4. Screenshots or a screen recording if relevant.
5. Your environment: browser, OS, Node version.
6. Whether the issue occurs in offline/demo mode or only against a live backend.

Use the **Bug Report** issue template.

---

## Suggesting Features

Feature requests are welcome. Open an issue using the **Feature Request** template and describe:

1. The problem you are trying to solve.
2. Your proposed solution or idea.
3. Any alternatives you considered.
4. Whether this aligns with the [Upgrade Roadmap](README.md#upgrade-roadmap).

---

## Upgrade Roadmap Contributions

The README lists a multi-phase roadmap (TypeScript ✅, Tailwind, TanStack Query, Next.js, etc.). If you want to contribute work that advances a roadmap phase:

1. Open an issue first to discuss scope and avoid duplicate effort.
2. Larger migrations (e.g. Next.js) should be broken into multiple PRs.
3. Each PR in a migration series should leave the app in a fully working state.

---

Thank you for helping make RepoMind better! 🚀
