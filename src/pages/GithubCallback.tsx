import { useEffect } from "react";
import api from "../utils/api";

export default function GithubCallback() {
  useEffect(() => {
    // Try to refresh the authenticated user; backend should set the HTTP-only cookie
    api
      .get("/auth/me")
      .then(() => {
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              { type: "github:auth:complete" },
              window.location.origin,
            );
          }
        } catch (e) {
          // ignore
        }
        // close the popup if possible
        try {
          window.close();
        } catch (e) {
          // ignore
        }
      })
      .catch(() => {
        // still attempt to notify opener of completion so it can refresh/fallback
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              { type: "github:auth:complete" },
              window.location.origin,
            );
          }
        } catch (e) {}
      });
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Finishing GitHub sign-in…</h2>
      <p>You can close this window if it doesn't close automatically.</p>
    </div>
  );
}
