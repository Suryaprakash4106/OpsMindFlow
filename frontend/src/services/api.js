import axios from 'axios';

// ✅ TEMPORARY FIX - Hardcode the backend URL
const API_URL = 'https://opsmindflow.onrender.com';
const baseURL = `${API_URL}/api`;

console.log('🔧 API Config (HARDCODED):', { API_URL, baseURL });

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Force withCredentials for ALL requests
api.defaults.withCredentials = true;

// 🔥 INTERCEPTOR FOR ALL REQUESTS
api.interceptors.request.use(request => {
  const sessionId = localStorage.getItem('sessionId');
  const userId = localStorage.getItem('userId');
  
  console.log('🔍 INTERCEPTOR RUNNING for:', request.url);
  console.log('📦 Full URL:', `${baseURL}${request.url}`);
  console.log('📦 localStorage sessionId:', sessionId ? sessionId.substring(0, 10) + '...' : 'NOT FOUND');
  
  if (sessionId) {
    request.headers['X-Session-ID'] = sessionId;
    console.log('✅ Added X-Session-ID header');
  }
  if (userId) {
    request.headers['X-User-ID'] = userId;
  }
  
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('✅ Response:', response.status, response.config.url);
    
    if (response.config.url.includes('/auth/login') && response.data?.user?._id) {
      const userId = response.data.user._id;
      const timestamp = Date.now();
      const sessionToken = btoa(userId + ':' + timestamp);
      
      localStorage.setItem('sessionId', sessionToken);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userRole', response.data.user.role);
      
      console.log('✅ Login - Session stored');
    }
    return response;
  },
  error => {
    console.error('❌ Error:', error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);

export default api;