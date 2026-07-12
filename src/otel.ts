import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { DocumentLoadInstrumentation } from "@opentelemetry/instrumentation-document-load";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { W3CTraceContextPropagator } from "@opentelemetry/core";

const otelEndpoint = import.meta.env.VITE_OTEL_TRACES_ENDPOINT;
const serviceName =
  import.meta.env.VITE_OTEL_SERVICE_NAME || "repomind-frontend";
const environment =
  import.meta.env.VITE_OTEL_ENVIRONMENT ||
  import.meta.env.MODE ||
  "development";

if (otelEndpoint) {
  const exporter = new OTLPTraceExporter({
    url: otelEndpoint,
  });

  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
    }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  provider.register({
    contextManager: new ZoneContextManager(),
    propagator: new W3CTraceContextPropagator(),
  });

  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new FetchInstrumentation({
        ignoreUrls: [/localhost:9100\/metrics/, /otlp/],
        propagateTraceHeaderCorsUrls: [/.*/],
      }),
      new XMLHttpRequestInstrumentation({
        ignoreUrls: [/localhost:9100\/metrics/, /otlp/],
      }),
    ],
    tracerProvider: provider,
  });

  console.info("OpenTelemetry enabled, exporting traces to", otelEndpoint);
} else {
  console.info(
    "OpenTelemetry disabled; set VITE_OTEL_TRACES_ENDPOINT to enable tracing.",
  );
}
