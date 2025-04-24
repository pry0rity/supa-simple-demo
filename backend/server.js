const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3001;

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // Enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // Enable Express.js middleware tracing
    new Sentry.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
  // Enable distributed tracing
  tracePropagationTargets: [
    'localhost', 
    /^\/api\//,
    new URL(process.env.SUPABASE_URL).hostname
  ],
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
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  console.error('Failed to initialize Supabase:', error.message);
}

// Routes
app.get('/api/slow', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  res.json({ message: "This response took 2 seconds to complete!" });
});

app.get('/api/db', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ 
        error: 'Database connection not available',
        details: 'Supabase client is not initialized'
      });
    }

    // Add a timeout to the Supabase query
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timed out')), 5000);
    });

    const queryPromise = supabase
      .from('users')
      .select('id, name, email, created_at')
      .order('id', { ascending: true })

    console.log('Executing Supabase query...');
    const { data: users, error } = await Promise.race([
      queryPromise,
      timeoutPromise
    ]);
  
    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ 
        error: 'Database query failed',
        details: error.message
      });
    }

    // Log the raw results to verify ordering
    console.log('Raw query results:', users);
    console.log('User IDs in order:', users.map(u => u.id));
  
    res.json(users);
  } catch (error) {
    console.error('Database error:', error);
    Sentry.captureException(error);
    
    // Check if it's a timeout error
    if (error.message === 'Database query timed out') {
      return res.status(504).json({ 
        error: 'Database timeout',
        details: 'The database is not responding. This might be because the Supabase project is suspended.'
      });
    }

    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message
    });
  }
});

app.get('/api/batch', async (req, res) => {
  const batchResults = [];
  for (let i = 1; i <= 12; i++) {
    const processingTime = 30;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    batchResults.push({
      id: i,
      message: `Batch item ${i} processed in ${processingTime}ms`,
      timestamp: new Date().toISOString()
    });
  }
  res.json(batchResults);
});

app.get('/api/user-attributes', async (req, res) => {
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
});

// N+1 Query demonstration endpoint
app.get('/api/users-with-posts', async (req, res) => {
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
    })
  );

  console.log('All users and posts fetched successfully');
  res.json(usersWithPosts);
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

// Single post endpoint for N+1 demo
app.get('/api/posts/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database connection not available' });
    }

    // Immediately execute query without any processing
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(post);
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// All posts endpoint for optimized query
app.get('/api/posts', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database connection not available' });
    }

    // Immediately execute query without any processing
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('id', { ascending: true })
      .limit(20);

    if (error) throw error;
    res.json(posts);
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Comments endpoint for a specific post
app.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database connection not available' });
    }

    const postId = req.params.postId;
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase comments query error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch comments',
        details: error.message
      });
    }

    res.json(comments);
  } catch (error) {
    console.error('Comments endpoint error:', error);
    Sentry.captureException(error);
    res.status(500).json({ 
      error: 'Failed to fetch comments',
      details: error.message
    });
  }
});

// All comments endpoint
app.get('/api/comments', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database connection not available' });
    }

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase all comments query error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch comments',
        details: error.message
      });
    }

    res.json(comments);
  } catch (error) {
    console.error('All comments endpoint error:', error);
    Sentry.captureException(error);
    res.status(500).json({ 
      error: 'Failed to fetch comments',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test Sentry error reporting
app.get('/api/debug-sentry', async (req, res, next) => {
  try {
    throw new Error('This error is happening on the server!');
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  res.statusCode = 500;
  res.json({ error: err.message });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});