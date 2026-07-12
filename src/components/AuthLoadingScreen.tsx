import type { ReactElement } from "react";

/** Full-viewport loading shell — matches luxury theme, avoids blank flashes on public routes */
export default function AuthLoadingScreen(): ReactElement {
  return (
    <div
      className="app-auth-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="app-auth-loading__inner">
        <span className="spinner" aria-hidden="true" />
        <span className="app-auth-loading__text">Loading…</span>
      </div>
    </div>
  );
}
