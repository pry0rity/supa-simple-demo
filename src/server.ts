import express from 'express';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { slowApi, dbQuery } from './api';

const app = express();
const port = 3000;

// Initialize Sentry
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
});

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// Middleware
app.use(express.json());

// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

// Routes
app.get('/api/slow', slowApi);
app.get('/api/db', dbQuery);

// Test Sentry error reporting
app.get('/debug-sentry', function mainHandler() {
  throw new Error('My first Sentry error!');
});

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err: Error, _req: express.Request, res: express.Response) {
  // The error id is attached to `res.sentry` to be returned
  res.statusCode = 500;
  res.json({ 
    error: err.message, 
    sentry: (res as any).sentry 
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Sentry initialized: ${process.env.SENTRY_DSN ? 'Yes' : 'No'}`);
});