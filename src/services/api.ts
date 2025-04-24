const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  // N+1 Query Demo methods
  getPost: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getAllPosts: async () => {
    const response = await fetch(`${API_BASE_URL}/posts`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  // JSONPlaceholder methods for the other demo
  getExternalPost: async (postId: number = 1) => {
    const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getExternalComments: async (postId: number = 1) => {
    const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}/comments`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getSlowResponse: async () => {
    const response = await fetch(`${API_BASE_URL}/slow`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },
  
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/db`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },
  
  getBatchResults: async () => {
    const response = await fetch(`${API_BASE_URL}/batch`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },
  
  getUserAttributes: async () => {
    const response = await fetch(`${API_BASE_URL}/user-attributes`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getPostIds: async () => {
    const response = await fetch(`${API_BASE_URL}/posts`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const posts = await response.json();
    return posts.map((post: { id: number }) => post.id);
  },

  getPosts: async () => {
    const response = await fetch(`${API_BASE_URL}/posts`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getPostComments: async (postId: number) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getAllComments: async () => {
    const response = await fetch('https://jsonplaceholder.typicode.com/comments');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/posts`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getProductReviews: async (productId: number) => {
    const response = await fetch(`${API_BASE_URL}/posts/${productId}/comments`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getAllReviews: async () => {
    const response = await fetch(`${API_BASE_URL}/comments`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }
};