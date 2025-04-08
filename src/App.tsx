import * as Sentry from "@sentry/react";
import { AppContent } from "./components/AppContent";

// Initialize Sentry
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    // Basic auto-instrumentation
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performance tracing sample rate
  tracesSampleRate: 1.0,
  // Session replay sample rate
  replaysSessionSampleRate: 0.1,
  // Error sampling
  replaysOnErrorSampleRate: 1.0,
  environment: "development",
  // Enable distributed tracing
  tracePropagationTargets: ["localhost", /^\/api\//],
});

export default AppContent;