import axios from 'axios';

// Get base URL from environment variable (for production)
const baseURL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';  // development: use proxy

console.log('API Base URL:', baseURL); // for debugging

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

export default api;