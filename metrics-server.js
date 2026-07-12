import express from "express";
import client from "prom-client";

const app = express();
app.use(express.json());

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const apiRequestCounter = new client.Counter({
  name: "api_requests_total",
  help: "Total number of API requests received",
  labelNames: ["method", "route", "status"],
});

const apiRequestDuration = new client.Histogram({
  name: "api_request_duration_seconds",
  help: "API request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const jobThroughputCounter = new client.Counter({
  name: "job_throughput_total",
  help: "Total number of completed job operations",
  labelNames: ["route", "status"],
});

const jobQueueDepthGauge = new client.Gauge({
  name: "job_queue_depth",
  help: "Current job queue depth (in-flight job requests)",
});

register.registerMetric(apiRequestCounter);
register.registerMetric(apiRequestDuration);
register.registerMetric(jobThroughputCounter);
register.registerMetric(jobQueueDepthGauge);

app.post("/event", (req, res) => {
  const event = req.body;

  if (!event || typeof event !== "object") {
    return res.status(400).send("Invalid event payload");
  }

  const { type } = event;

  if (type === "api") {
    const {
      method = "GET",
      route = "unknown",
      status = "unknown",
      durationMs = 0,
    } = event;
    const statusLabel = `${status}`;

    apiRequestCounter.inc({ method, route, status: statusLabel }, 1);
    apiRequestDuration.observe(
      { method, route, status: statusLabel },
      durationMs / 1000,
    );
    return res.status(204).end();
  }

  if (type === "job") {
    const {
      event: jobEvent,
      route = "unknown",
      status = "unknown",
      queueDepth,
    } = event;

    if (jobEvent === "throughput") {
      jobThroughputCounter.inc({ route, status: `${status}` }, 1);
      return res.status(204).end();
    }

    if (jobEvent === "queue_depth" && typeof queueDepth === "number") {
      jobQueueDepthGauge.set(queueDepth);
      return res.status(204).end();
    }
  }

  res.status(400).send("Unsupported event type");
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
});

app.get("/health", (_req, res) => {
  res.send("ok");
});

const port = Number(process.env.METRICS_PORT) || 9100;
app.listen(port, () => {
  console.log(
    `Prometheus metrics server listening on http://localhost:${port}/metrics`,
  );
});
