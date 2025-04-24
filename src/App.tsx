import * as Sentry from "@sentry/react";
import { AppContent } from "./components/AppContent";

// Initialize Sentry
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

console.log(
  "Initializing Sentry with DSN:",
  SENTRY_DSN ? "DSN is defined" : "DSN is undefined"
);

Sentry.init({
  dsn: SENTRY_DSN,
  debug: true,
  integrations: [
    Sentry.browserTracingIntegration(),

    Sentry.replayIntegration({
      // Capture 100% of sessions for testing
      maskAllText: false,
      blockAllMedia: false,
      networkDetailAllowUrls: [window.location.origin],
      networkCaptureBodies: true,
      networkRequestHeaders: ["content-type", "accept"],
      networkResponseHeaders: ["content-type"],
    }),
  ],

  tracesSampleRate: 1.0,

  replaysSessionSampleRate: 1.0, // Record all sessions
  replaysOnErrorSampleRate: 1.0, // Record all sessions with errors
  environment: "development",
  tracePropagationTargets: [
    "localhost",
    /^\/api\//,
    "jsonplaceholder.typicode.com",
  ],
});

// Test replay functionality
console.log("Testing Sentry Replay...");
Sentry.withScope((scope) => {
  scope.setTag("test_type", "replay");
  Sentry.captureMessage("Testing replay functionality", "info");
});

export default AppContent;
