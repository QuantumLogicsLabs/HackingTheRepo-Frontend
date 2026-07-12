import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

const sentryPlugin =
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT
    ? sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        url: process.env.SENTRY_URL || "https://sentry.io/",
        release:
          process.env.SENTRY_RELEASE ||
          process.env.npm_package_version ||
          "frontend@local",
        include: "./dist",
        ignore: ["node_modules", "vite.config.js"],
        setCommits: { auto: true },
        sourceMaps: {
          include: ["dist/assets"],
        },
        silent: true,
      })
    : null;

export default defineConfig({
  plugins: [react(), ...(sentryPlugin ? [sentryPlugin] : [])],
  build: {
    sourcemap: true,
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/metrics": {
        target: "http://localhost:9100",
        changeOrigin: true,
      },
    },
  },
});
