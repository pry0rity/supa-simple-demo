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
      // Query the database for users
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      // Just returning users directly
      const result = users;
      
      res.json(result);
    } catch (error) {
      console.error('Database error:', error);
      
      // Capture the error with Sentry
      Sentry.captureException(error);
      
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
};