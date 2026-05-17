# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | ✅ Yes             |
| < 1.0   | ❌ No              |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in RepoMind, please disclose it responsibly by emailing **security@repomind.dev** (replace with your actual address). Include as much detail as possible:

- A description of the vulnerability and its potential impact
- Step-by-step instructions to reproduce it
- Any proof-of-concept code or screenshots
- Your suggested fix, if you have one

You can expect an acknowledgement within **48 hours** and a status update within **7 days**. We will coordinate a fix and a public disclosure date with you.

---

## Scope

The following are **in scope** for responsible disclosure:

- Authentication and session management flaws (`AuthContext`, JWT handling, localStorage token storage)
- Cross-Site Scripting (XSS) vulnerabilities in rendered content
- Sensitive data exposure (tokens, credentials, user PII)
- Dependency vulnerabilities with a known CVE and a proven attack path against this application

The following are **out of scope:**

- Issues in third-party services (GitHub API, OpenAI API)
- Bugs that require physical access to a user's device
- Social engineering attacks
- Denial-of-service attacks
- Issues already reported or already publicly known

---

## Known Security Considerations

### JWT stored in `localStorage`
The current implementation stores the bearer token in `localStorage` (`rm_token`). This is a deliberate trade-off for the v1.0 SPA architecture. The [Upgrade Roadmap](README.md#upgrade-roadmap) includes migrating to HttpOnly cookie sessions (Auth.js v5) which eliminates this risk.

### Demo credentials in source
The demo account (`demo@repomind.dev` / `demo1234`) is intentionally seeded in `AuthContext` for offline exploration. It provides no access to real resources and should never be used in production with a live backend.

---

## Dependency Auditing

Run the following regularly to check for known vulnerabilities in npm dependencies:

```bash
npm audit
npm audit fix
```

For a detailed report:

```bash
npm audit --json
```

---

## Preferred Languages

We prefer reports in **English**.
