import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@sentry/react";
import App from "./App";
import "./index.css";
import "./otel";
import "./sentry";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root was not found");
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary
      fallback={<div>Something went wrong. The error has been reported.</div>}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
