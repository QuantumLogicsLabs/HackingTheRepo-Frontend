import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN;
const environment =
  import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE;
const tracesSampleRate = Number(
  import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.25,
);
const release =
  import.meta.env.VITE_SENTRY_RELEASE ||
  import.meta.env.npm_package_version ||
  "frontend@local";

if (dsn) {
  Sentry.init({
    dsn,
    integrations: [
      // Use the React package's browser tracing integration without unsupported options.
      Sentry.browserTracingIntegration(),
    ],
    environment,
    release,
    tracesSampleRate,
    attachStacktrace: true,
    normalizeDepth: 10,
    beforeSend(event) {
      return event;
    },
  });
}
