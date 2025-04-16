import * as Sentry from '@sentry/react';

const API_BASE_URL = 'http://localhost:3000/api';

// Simplified fetch utility with better trace context propagation
async function simpleFetch(url: string, options?: RequestInit) { 
  return Sentry.startSpan(
    {
      name: `fetch.${url.split('?')[0]}`, // Remove query params from span name for cleaner display
      op: 'http.client',
      description: `Fetch request to ${url}`,
    },
    async (span) => {
      try {
        // Create headers if they don't exist
        const headers = options?.headers || {};
        
        // Create a modified options object with Sentry trace headers
        const tracedOptions = {
          ...options,
          headers: {
            ...headers,
            // Add Sentry trace propagation header
            'sentry-trace': span?.toTraceparent() || ''
          }
        };
        
        // Record span start time for more accurate timing
        const startTime = performance.now();
        
        // Make the fetch request with trace context
        const response = await fetch(url, tracedOptions);
        
        // Record timing data
        span?.setData('response_time_ms', Math.round(performance.now() - startTime));
        span?.setData('status_code', response.status);
        span?.setStatus(response.ok ? 'ok' : 'error');
        
        // Parse and return response
        return await response.json();
      } catch (error) {
        // Mark span as error and capture details
        span?.setStatus('error');
        span?.setData('error', error instanceof Error ? error.message : String(error));
        
        // Capture the error with Sentry
        Sentry.captureException(error);
        
        // Re-throw the error
        throw error;
      }
    }
  );
}

export const api = {
  getSlowResponse: async () => {
    return simpleFetch(`${API_BASE_URL}/slow`);
  },
  
  getUsers: async () => {
    return simpleFetch(`${API_BASE_URL}/db`);
  },
  
  // Added to handle batch requests that were going to /api/batch directly 
  getBatchResults: async () => {
    return simpleFetch(`${API_BASE_URL}/batch`);
  },
  
  // Added for client component demo
  getUserAttributes: async () => {
    return simpleFetch(`${API_BASE_URL}/user-attributes`);
  },
  
  // 3rd party API example with JSONPlaceholder
  getExternalPost: async (postId: number = 1) => {
    return simpleFetch(`https://jsonplaceholder.typicode.com/posts/${postId}`);
  },
  
  getExternalComments: async (postId: number = 1) => {
    return simpleFetch(`https://jsonplaceholder.typicode.com/posts/${postId}/comments`);
  },
  
  // N+1 Query Demo methods
  getUsersWithPosts: async () => {
    return simpleFetch(`${API_BASE_URL}/users-with-posts`);
  },
  
  getUsersWithPostsOptimized: async () => {
    return simpleFetch(`${API_BASE_URL}/users-with-posts-optimized`);
  },

  // Add new methods for posts and comments
  getPostIds: async () => {
    // Get all posts but only return their IDs
    const posts = await simpleFetch(`${API_BASE_URL}/posts`);
    return posts.map((post: { id: number }) => post.id);
  },

  getPost: async (postId: number) => {
    return simpleFetch(`${API_BASE_URL}/posts/${postId}`);
  },

  getPosts: async () => {
    return simpleFetch('https://jsonplaceholder.typicode.com/posts');
  },

  getPostComments: async (postId: number) => {
    return simpleFetch(`https://jsonplaceholder.typicode.com/posts/${postId}/comments`);
  },

  getAllComments: async () => {
    return simpleFetch('https://jsonplaceholder.typicode.com/comments');
  }
};