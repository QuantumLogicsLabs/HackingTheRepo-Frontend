import axios, { type AxiosRequestConfig } from "axios";
import { context, propagation } from "@opentelemetry/api";
import { getApiBaseUrl } from "./env";
import { sendMetricEvent } from "./metrics";

const baseURL = getApiBaseUrl();

const api = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
});

const pendingJobRequests = new Set<string>();

function normalizeRoute(url: string | undefined): string {
  if (!url) {
    return "unknown";
  }

  let path = url;

  if (path.startsWith("http")) {
    try {
      path = new URL(path).pathname;
    } catch {
      // ignore
    }
  }

  return path.replace(/\/[0-9a-fA-F_-]+/g, "/:id");
}

function isJobRequest(url: string | undefined): boolean {
  const path = normalizeRoute(url);
  return path.startsWith("/jobs");
}

api.interceptors.request.use((config) => {
  const now = Date.now();
  config.headers = config.headers ?? {};
  propagation.inject(context.active(), config.headers);
  (
    config as AxiosRequestConfig & { metadata?: { startTime: number } }
  ).metadata = {
    startTime: now,
  };

  if (isJobRequest(config.url)) {
    const requestId = `${config.method ?? "GET"}:${config.url}`;
    pendingJobRequests.add(requestId);
    void sendMetricEvent({
      type: "job",
      event: "queue_depth",
      route: normalizeRoute(config.url),
      queueDepth: pendingJobRequests.size,
    });
  }

  return config;
});

api.interceptors.response.use(
  async (response) => {
    const config = response.config as AxiosRequestConfig & {
      metadata?: { startTime: number };
    };
    const route = normalizeRoute(config.url);
    const durationMs = config.metadata?.startTime
      ? Date.now() - config.metadata.startTime
      : 0;

    void sendMetricEvent({
      type: "api",
      method: (config.method ?? "GET").toUpperCase(),
      route,
      status: response.status,
      durationMs,
    });

    if (isJobRequest(config.url)) {
      const requestId = `${config.method ?? "GET"}:${config.url}`;
      pendingJobRequests.delete(requestId);
      void sendMetricEvent({
        type: "job",
        event: "queue_depth",
        route,
        queueDepth: pendingJobRequests.size,
      });
      void sendMetricEvent({
        type: "job",
        event: "throughput",
        route,
        status: response.status,
      });
    }

    return response;
  },
  async (error) => {
    const config =
      (error.config as AxiosRequestConfig & {
        metadata?: { startTime: number };
      }) ?? {};
    const route = normalizeRoute(config.url);
    const durationMs = config.metadata?.startTime
      ? Date.now() - config.metadata.startTime
      : 0;
    const status = error.response?.status ?? "ERROR";

    void sendMetricEvent({
      type: "api",
      method: (config.method ?? "GET").toUpperCase(),
      route,
      status,
      durationMs,
    });

    if (isJobRequest(config.url)) {
      const requestId = `${config.method ?? "GET"}:${config.url}`;
      pendingJobRequests.delete(requestId);
      void sendMetricEvent({
        type: "job",
        event: "queue_depth",
        route,
        queueDepth: pendingJobRequests.size,
      });
      void sendMetricEvent({
        type: "job",
        event: "throughput",
        route,
        status,
      });
    }

    return Promise.reject(error);
  },
);

export default api;
