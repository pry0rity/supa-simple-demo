import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import express from 'express';

/**
 * Initialize Sentry for the backend
 * 
 * @param app Express application instance
 * @returns Sentry handlers for request and error tracking
 */
export function initSentry(app: express.Application) {
  // Initialize Sentry
  // Make sure to set the SENTRY_DSN environment variable
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      // Add profiling integration
      nodeProfilingIntegration(),
    ],
    // Set tracesSampleRate to 1.0 for development, lower in production
    tracesSampleRate: 1.0,
    // Set profilesSampleRate to 1.0 for development, lower in production
    profilesSampleRate: 1.0,
    // Enable distributed tracing
    tracePropagationTargets: ['localhost', /^\/api\//],
    // Attach request data to performance monitoring
    sendDefaultPii: true,
    // Enable source code context
    includeLocalVariables: true,
  });

  // Get Sentry handlers
  return {
    requestHandler: Sentry.Handlers.requestHandler(),
    tracingHandler: Sentry.Handlers.tracingHandler(),
    errorHandler: Sentry.Handlers.errorHandler(),
    sentryInstance: Sentry
  };
}