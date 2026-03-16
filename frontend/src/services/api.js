import axios from 'axios';

// IMPORTANT: Get the exact backend URL
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

// Force cookies to be sent with every request
api.defaults.withCredentials = true;

export default api;