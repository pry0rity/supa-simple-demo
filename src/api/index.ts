import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/node';

// Remove VITE_ prefix since this is server-side code
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const slowApi = async (_req: Request, res: Response) => {
  // Get the active transaction
  const scope = Sentry.getCurrentHub().getScope();
  const transaction = scope?.getTransaction();
  
  try {
    // Create a child span for the waiting operation
    const waitSpan = transaction?.startChild({
      op: 'timer',
      description: 'Waiting period'
    });
    
    // Simulate a slow API response
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Finish the wait span
    waitSpan?.finish();
    
    res.json({ message: "This response took 2 seconds to complete!" });
  } catch (error) {
    // Capture the error with Sentry
    Sentry.captureException(error);
    
    res.status(500).json({ error: 'Something went wrong!' });
  }
};

export const dbQuery = async (_req: Request, res: Response) => {
  // Get the active transaction
  const scope = Sentry.getCurrentHub().getScope();
  const transaction = scope?.getTransaction();
  
  try {
    // Create a child span for the database query
    const dbSpan = transaction?.startChild({
      op: 'db.supabase',
      description: 'Fetch users from database'
    });
    
    // Query the database for users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false });

    // Finish the database span
    dbSpan?.finish();
    
    if (error) {
      throw error;
    }
    
    // Create another child span for response formatting
    const formatSpan = transaction?.startChild({
      op: 'format',
      description: 'Format response'
    });
    
    // Just sending JSON directly, but in a real app you might do more processing
    const result = users;
    
    // Finish the format span
    formatSpan?.finish();
    
    res.json(result);
  } catch (error) {
    console.error('Database error:', error);
    
    // Capture the error with Sentry
    Sentry.captureException(error);
    
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};