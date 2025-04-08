import type { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

export const batchApiController = {
  getBatchResults: async (req: Request, res: Response) => {
    try {
      // Create parent span for batch operation using modern span instrumentation
      const results = await Sentry.startSpan(
        {
          name: 'batch-api-process',
          op: 'batch',
          description: 'Process batch requests',
        },
        async (parentSpan) => {
          const batchResults: string[] = [];
          
          // Process 3 batch items with child spans
          for (let i = 1; i <= 3; i++) {
            const itemResult = await Sentry.startSpan(
              {
                name: `batch-item-${i}`,
                op: 'batch.item',
                description: `Process batch item ${i}`,
              },
              async () => {
                // Simulate processing time with some variance
                const processingTime = 100 + Math.floor(Math.random() * 200);
                await new Promise(resolve => setTimeout(resolve, processingTime));
                return `Batch item ${i} processed in ${processingTime}ms`;
              }
            );
            
            batchResults.push(itemResult);
          }
          
          parentSpan?.setStatus('ok');
          return batchResults;
        }
      );
      
      res.json(results);
    } catch (error) {
      // Capture the error with Sentry
      Sentry.captureException(error);
      
      res.status(500).json({ error: 'Failed to process batch requests' });
    }
  }
};