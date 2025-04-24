const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Simple fetch utility without custom Sentry instrumentation
async function simpleFetch(url: string, options?: RequestInit) { 
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
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
  getPost: async (id: number) => {
    return simpleFetch(`${API_BASE_URL}/posts/${id}`);
  },

  getAllPosts: async () => {
    return simpleFetch(`${API_BASE_URL}/posts`);
  },

  // Add new methods for posts and comments
  getPostIds: async () => {
    // Get all posts but only return their IDs
    const posts = await simpleFetch(`${API_BASE_URL}/posts`);
    return posts.map((post: { id: number }) => post.id);
  },

  getPosts: async () => {
    return simpleFetch(`${API_BASE_URL}/posts`);
  },

  getPostComments: async (postId: number) => {
    return simpleFetch(`${API_BASE_URL}/posts/${postId}/comments`);
  },

  getAllComments: async () => {
    return simpleFetch('https://jsonplaceholder.typicode.com/comments');
  },

  // Product-related endpoints for N+1 demo (using Supabase)
  getProducts: async () => {
    return simpleFetch(`${API_BASE_URL}/posts`);
  },

  getProductReviews: async (productId: number) => {
    return simpleFetch(`${API_BASE_URL}/posts/${productId}/comments`);
  },

  getAllReviews: async () => {
    return simpleFetch(`${API_BASE_URL}/comments`);
  },
};