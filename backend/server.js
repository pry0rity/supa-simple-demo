require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // Enable Express.js middleware tracing
    new Sentry.Integrations.Express({ app }),
    // Add profiling integration
    new ProfilingIntegration(),
  ],
  // Set tracesSampleRate to 1.0 for development, lower in production
  tracesSampleRate: 1.0,
  // Set profilesSampleRate to 1.0 for development, lower in production
  profilesSampleRate: 1.0,
});

// The request handler must be the first middleware
app.use(Sentry.Handlers.requestHandler());

// TracingHandler should be after request handler but before routes
app.use(Sentry.Handlers.tracingHandler());

// Regular middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Routes
app.get('/api/slow', async (req, res) => {
  try {
    // Simulate a slow API response
    await new Promise(resolve => setTimeout(resolve, 2000));
    res.json({ message: "This response took 2 seconds to complete!" });
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/api/db', async (req, res) => {
  try {
    // Query the database for users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.json(users);
  } catch (error) {
    console.error('Database error:', error);
    Sentry.captureException(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/batch', async (req, res) => {
  try {
    const batchResults = [];
    
    // Process 3 batch items
    for (let i = 1; i <= 3; i++) {
      // Simulate processing time with some variance
      const processingTime = 100 + Math.floor(Math.random() * 200);
      await new Promise(resolve => setTimeout(resolve, processingTime));
      batchResults.push(`Batch item ${i} processed in ${processingTime}ms`);
    }
    
    res.json(batchResults);
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ error: 'Failed to process batch requests' });
  }
});

app.get('/api/user-attributes', async (req, res) => {
  try {
    // Simulated user data
    const userData = {
      id: 12345,
      name: 'Test User',
      email: 'test@example.com',
      preferences: {
        theme: 'dark',
        notifications: true,
        language: 'en-US',
      }
    };
    
    res.json(userData);
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ error: 'Failed to get user attributes' });
  }
});

// Test Sentry error reporting
app.get('/debug-sentry', function mainHandler(req, res) {
  throw new Error('My first Sentry error!');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// The Sentry error handler must be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  res.statusCode = 500;
  res.json({ 
    error: err.message,
    // Include the Sentry event ID for reference
    eventId: res.sentry 
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Sentry initialized: ${process.env.SENTRY_DSN ? 'Yes' : 'No'}`);
});