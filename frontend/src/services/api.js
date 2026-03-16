import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://opsmindflow.onrender.com';
const baseURL = `${API_URL}/api`;

console.log('🔧 API Config:', { API_URL, baseURL });

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,  // MUST be true
  headers: {
    'Content-Type': 'application/json',
  }
});

// FORCE cookies to be sent with EVERY request
api.defaults.withCredentials = true;

// Add request interceptor to verify cookies are being sent
api.interceptors.request.use(request => {
  console.log('🚀 Sending request to:', request.url);
  console.log('🍪 withCredentials:', request.withCredentials);
  return request;
});

export default api;