import * as Sentry from '@sentry/react';

const API_BASE_URL = 'http://localhost:3000/api';

// Simplified fetch utility - Sentry automatically instruments fetch API calls
async function simpleFetch(url: string, options?: RequestInit) {
  try {
    // Fetch with standard options. Sentry auto-instruments network requests
    const response = await fetch(url, options);
    
    // Parse and return response
    return await response.json();
  } catch (error) {
    // Capture the error with Sentry (auto-instrumentation will track the failed request)
    Sentry.captureException(error);
    
    // Re-throw the error
    throw error;
  }
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
  }
};