import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://opsmindflow.onrender.com';
const baseURL = `${API_URL}/api`;

console.log('🔧 API Config:', { API_URL, baseURL });

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Force withCredentials for ALL requests
api.defaults.withCredentials = true;

// Add request interceptor to log cookies
api.interceptors.request.use(request => {
  console.log('🚀 Request:', {
    url: request.url,
    method: request.method,
    withCredentials: request.withCredentials,
    cookies: document.cookie // Check if cookies exist
  });
  return request;
});

// Add response interceptor
api.interceptors.response.use(
  response => {
    console.log('✅ Response:', response.status);
    return response;
  },
  error => {
    console.log('❌ Error:', {
      status: error.response?.status,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export default api;