const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Debug: Log environment variables
console.log('Environment variables:', {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY_LENGTH: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : 0,
  NODE_ENV: process.env.NODE_ENV,
  PWD: process.env.PWD
});

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
let supabase = null;

try {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  console.log('Initializing Supabase client with URL:', supabaseUrl);
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase:', error.message);
}

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
    if (!supabase) {
      return res.status(503).json({ error: 'Database connection not available' });
    }
    // Query the database for users
    console.log('Querying Supabase users table...');
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false });
    
    console.log('Supabase query result:', { users, error });
    
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
    
    // Process at least 10 items to meet N+1 detection criteria
    for (let i = 1; i <= 12; i++) {
      // Use consistent delay to ensure calls are within 5ms of each other
      // But total duration exceeds 300ms
      const processingTime = 30; // Each call takes 30ms, 12 calls = 360ms total
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // Simulate an HTTP client call (not GraphQL or static resource)
      await Sentry.startSpan(
        {
          op: "http.client",
          name: `Process batch item ${i}`,
          description: "Individual batch item processing"
        },
        async () => {
          batchResults.push({
            id: i,
            message: `Batch item ${i} processed in ${processingTime}ms`,
            timestamp: new Date().toISOString()
          });
        }
      );
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

// N+1 Query demonstration endpoint
app.get('/api/users-with-posts', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database connection not available' });
    }

    console.log('Fetching users...');
    // First query to get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(12); // Get 12 users to ensure we trigger N+1 detection

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    console.log('Users fetched:', users?.length);

    // N+1 problem: Making a separate query for each user's posts
    const usersWithPosts = await Promise.all(
      users.map(async (user) => {
        return await Sentry.startSpan(
          {
            op: "http.client",
            name: `Fetch posts for user ${user.id}`,
            description: "Individual user posts query"
          },
          async () => {
            console.log(`Fetching posts for user ${user.id}...`);
            // Simulate network delay that's consistent with N+1 criteria
            await new Promise(resolve => setTimeout(resolve, 30));
            
            const { data: posts, error: postsError } = await supabase
              .from('posts')
              .select('id, title, content')
              .eq('user_id', user.id);

            if (postsError) {
              console.error(`Error fetching posts for user ${user.id}:`, postsError);
              throw postsError;
            }

            console.log(`Found ${posts?.length} posts for user ${user.id}`);

            return {
              ...user,
              posts: posts || []
            };
          }
        );
      })
    );

    console.log('All users and posts fetched successfully');
    res.json(usersWithPosts);
  } catch (error) {
    console.error('N+1 query error:', error);
    Sentry.captureException(error);
    res.status(500).json({ 
      error: 'Failed to fetch users with posts',
      details: error.message 
    });
  }
});

// Optimized version that uses a single query
app.get('/api/users-with-posts-optimized', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database connection not available' });
    }

    console.log('Fetching users and posts with optimized query...');
    
    await Sentry.startSpan(
      {
        op: "http.client",
        name: "Fetch users with posts (optimized)",
        description: "Single query for users and their posts"
      },
      async () => {
        // Single query to get all users with their posts using a join
        const { data: usersWithPosts, error } = await supabase
          .from('users')
          .select(`
            id,
            name,
            email,
            posts (
              id,
              title,
              content
            )
          `)
          .limit(12);

        if (error) {
          console.error('Error in optimized query:', error);
          throw error;
        }

        console.log(`Successfully fetched ${usersWithPosts?.length} users with their posts in a single query`);
        const totalPosts = usersWithPosts?.reduce((sum, user) => sum + (user.posts?.length || 0), 0);
        console.log(`Total posts fetched: ${totalPosts}`);

        // Add a small delay to make the timing more visible
        await new Promise(resolve => setTimeout(resolve, 100));

        res.json(usersWithPosts);
      }
    );
  } catch (error) {
    console.error('Optimized query error:', error);
    Sentry.captureException(error);
    res.status(500).json({ 
      error: 'Failed to fetch users with posts',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test Sentry error reporting
app.get('/api/debug-sentry', function mainHandler(req, res) {
  throw new Error('My first Sentry error!');
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