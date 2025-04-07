import * as Sentry from '@sentry/react';

const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to add Sentry tracing to fetch operations
async function tracedFetch(url: string, options?: RequestInit, extraContext?: Record<string, string>) {
  return Sentry.startSpan(
    {
      name: `GET ${url.replace(API_BASE_URL, '')}`,
      op: 'http.client',
      attributes: extraContext,
    },
    async (span) => {
      try {
        // Perform the fetch with distributed tracing headers
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            // Add custom trace ID header for connecting traces
            'sentry-trace': span!.spanContext().traceId
          }
        });

        // Add response status to the span attributes
        span!.setAttribute('http.status_code', response.status);

        // Parse response
        const data = await response.json();

        return data;
      } catch (error) {
        // Capture the error with Sentry
        Sentry.captureException(error, {
          tags: {
            url: url,
            ...extraContext
          }
        });
        
        // Re-throw the error
        throw error;
      }
    }
  );
}

export const api = {
  getSlowResponse: async () => {
    return tracedFetch(`${API_BASE_URL}/slow`, undefined, { api: 'slow' });
  },
  
  getUsers: async () => {
    return tracedFetch(`${API_BASE_URL}/db`, undefined, { api: 'users', entity: 'users' });
  }
};