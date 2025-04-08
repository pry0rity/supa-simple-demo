import type { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

export const userAttributesController = {
  getUserAttributes: async (_req: Request, res: Response) => {
    try {
      const userData = await Sentry.startSpan(
        {
          name: 'user-attributes',
          op: 'user.data',
          description: 'Generate user attributes',
        },
        async () => {
          // Simulated user data
          return {
            id: 12345,
            name: 'Test User',
            email: 'test@example.com',
            preferences: {
              theme: 'dark',
              notifications: true,
              language: 'en-US',
            }
          };
        }
      );
      
      res.json(userData);
    } catch (error) {
      // Capture the error with Sentry
      Sentry.captureException(error);
      
      res.status(500).json({ error: 'Failed to get user attributes' });
    }
  }
};