import * as Sentry from '@sentry/react';

const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to add Sentry tracing to fetch operations using modern span instrumentation
async function tracedFetch(url: string, options?: RequestInit, extraContext?: Record<string, string>) {
  const spanOp = 'http.client';
  const spanName = `GET ${url.replace(API_BASE_URL, '')}`;
  
  return Sentry.startSpan(
    {
      name: spanName,
      op: spanOp,
      attributes: extraContext,
    },
    async (span) => {
      try {
        // Perform the fetch with distributed tracing headers
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            // Sentry automatically adds trace headers with span context
          }
        });

        // Add response status to the span attributes
        span?.setAttribute('http.status_code', response.status);

        // Parse response
        const data = await response.json();

        return data;
      } catch (error) {
        // Capture the error with Sentry
        span?.setStatus('error');
        
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
  },
  
  // Added to handle batch requests that were going to /api/batch directly 
  getBatchResults: async () => {
    return tracedFetch(`${API_BASE_URL}/batch`, undefined, { api: 'batch' });
  },
  
  // Added for client component demo
  getUserAttributes: async () => {
    return tracedFetch(`${API_BASE_URL}/user-attributes`, undefined, { api: 'user-attributes' });
  }
};