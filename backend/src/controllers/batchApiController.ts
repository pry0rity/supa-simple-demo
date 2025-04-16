import type { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

export const batchApiController = {
  getBatchResults: async (req: Request, res: Response) => {
    try {
      const batchResults: string[] = [];
      
      // Process 3 batch items
      for (let i = 1; i <= 3; i++) {
        // Simulate processing time with some variance
        const processingTime = 100 + Math.floor(Math.random() * 200);
        await new Promise(resolve => setTimeout(resolve, processingTime));
        const itemResult = `Batch item ${i} processed in ${processingTime}ms`;
        
        batchResults.push(itemResult);
      }
      
      const results = batchResults;
      
      res.json(results);
    } catch (error) {
      // Capture the error with Sentry
      Sentry.captureException(error);
      
      res.status(500).json({ error: 'Failed to process batch requests' });
    }
  }
};