import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/node';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const dbQueryController = {
  getUsers: async (req: Request, res: Response) => {
    try {
      // Use modern span instrumentation for database query
      const users = await Sentry.startSpan(
        {
          name: 'db-query-users',
          op: 'db.supabase',
          description: 'Fetch users from database',
        },
        async (span) => {
          // Query the database for users
          const { data, error } = await supabase
            .from('users')
            .select('id, name, email, created_at')
            .order('created_at', { ascending: false });

          if (error) {
            span?.setStatus('error');
            throw error;
          }

          span?.setStatus('ok');
          return data;
        }
      );
      
      // Use modern span instrumentation for response formatting
      const result = await Sentry.startSpan(
        {
          name: 'format-response',
          op: 'format',
          description: 'Format response',
        },
        async () => {
          // Just returning users directly, but in a real app you might do more processing
          return users;
        }
      );
      
      res.json(result);
    } catch (error) {
      console.error('Database error:', error);
      
      // Capture the error with Sentry
      Sentry.captureException(error);
      
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
};