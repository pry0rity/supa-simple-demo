import type { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

export const slowApiController = {
  getSlowResponse: async (req: Request, res: Response) => {
    try {
      // Simple waiting operation
      const waitTime = 2000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      res.json({ message: "This response took 2 seconds to complete!" });
    } catch (error) {
      // Capture the error with Sentry
      Sentry.captureException(error);
      
      res.status(500).json({ error: 'Something went wrong!' });
    }
  }
};