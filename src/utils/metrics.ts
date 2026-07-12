import axios from "axios";
import { getClientEnv } from "./env";

const metricsEnabled = getClientEnv("VITE_METRICS_ENABLED", "true") !== "false";
const metricsBaseUrl = getClientEnv("VITE_METRICS_URL", "/metrics");

const metricsClient = axios.create({
  baseURL: metricsBaseUrl,
  timeout: 2000,
});

export type MetricEvent =
  | {
      type: "api";
      method: string;
      route: string;
      status: number | string;
      durationMs: number;
    }
  | {
      type: "job";
      event: "throughput" | "queue_depth";
      route: string;
      status?: number | string;
      queueDepth?: number;
    };

export async function sendMetricEvent(event: MetricEvent): Promise<void> {
  if (!metricsEnabled) {
    return;
  }

  try {
    await metricsClient.post("/event", event);
  } catch (error) {
    // Keep metrics best-effort only.
    console.debug("Metrics event failed:", error);
  }
}
