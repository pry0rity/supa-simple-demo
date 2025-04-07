import type { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

export const slowApiController = {
  getSlowResponse: async (req: Request, res: Response) => {
    // Get the transaction that was created by Sentry.Handlers.tracingHandler()
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    
    try {
      // Simulate a slow API response
      const waitTime = 2000;
      
      // Create a child span for the waiting operation
      const waitSpan = transaction?.startChild({
        op: 'timer',
        description: 'Waiting period'
      });
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Finish the wait span
      waitSpan?.finish();
      
      res.json({ message: "This response took 2 seconds to complete!" });
    } catch (error) {
      // Capture the error with Sentry
      Sentry.captureException(error);
      
      res.status(500).json({ error: 'Something went wrong!' });
    }
  }
};