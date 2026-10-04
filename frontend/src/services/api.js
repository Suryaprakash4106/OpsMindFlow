import axios from 'axios';

const API_URL = 'https://opsmindflow.onrender.com';
const baseURL = `${API_URL}/api`;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT to every request
api.interceptors.request.use((request) => {
  const token = localStorage.getItem('token');
  if (token) {
    request.headers['Authorization'] = `Bearer ${token}`;
  }
  return request;
});

// Store token on login
api.interceptors.response.use(
  (response) => {
    if (response.config.url.includes('/auth/login') && response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.user._id);
      localStorage.setItem('userRole', response.data.user.role);
      localStorage.setItem('userName', response.data.user.name);
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export const isAuthenticated = () => !!localStorage.getItem('token');

export const getCurrentUser = () => {
  const userId = localStorage.getItem('userId');
  if (!userId) return null;
  return {
    _id: userId,
    role: localStorage.getItem('userRole'),
    name: localStorage.getItem('userName'),
  };
};

export default api;