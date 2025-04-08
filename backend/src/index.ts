import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initSentry } from './config/sentry.js';
import { slowApiRoutes } from './routes/slowApiRoutes.js';
import { dbQueryRoutes } from './routes/dbQueryRoutes.js';
import { batchApiRoutes } from './routes/batchApiRoutes.js';
import { userAttributesRoutes } from './routes/userAttributesRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Sentry (must be done before other middleware)
const { requestHandler, tracingHandler, errorHandler } = initSentry(app);

// Sentry request handler must be the first middleware
app.use(requestHandler);

// Standard middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Sentry tracing middleware should be after standard middleware
app.use(tracingHandler);

// Routes
app.use('/api/slow', slowApiRoutes);
app.use('/api/db', dbQueryRoutes);
app.use('/api/batch', batchApiRoutes);
app.use('/api/user-attributes', userAttributesRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test Sentry endpoint
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.get('/debug-sentry', (_req, _res) => {
  throw new Error('My first Sentry error!');
});

// Sentry error handler must be before any other error middleware and after all controllers
app.use(errorHandler);

// Regular error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Sentry initialized: ${process.env.SENTRY_DSN ? 'Yes' : 'No'}`);
});