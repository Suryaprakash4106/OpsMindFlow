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

// 🔥 INTERCEPTOR FOR ALL REQUESTS
api.interceptors.request.use(request => {
  // Get session data from localStorage
  const sessionId = localStorage.getItem('sessionId');
  const userId = localStorage.getItem('userId');
  
  console.log('🔍 INTERCEPTOR RUNNING for:', request.url);
  console.log('📦 localStorage sessionId:', sessionId ? sessionId.substring(0, 10) + '...' : 'NOT FOUND');
  console.log('📦 localStorage userId:', userId);
  
  if (sessionId) {
    request.headers['X-Session-ID'] = sessionId;
    console.log('✅ Added X-Session-ID header');
  } else {
    console.log('⚠️ No sessionId in localStorage');
  }
  
  if (userId) {
    request.headers['X-User-ID'] = userId;
    console.log('✅ Added X-User-ID header');
  }
  
  console.log('🚀 Final Headers:', Object.keys(request.headers).filter(k => k.includes('X-')));
  
  return request;
});

// 🔥 Response interceptor
api.interceptors.response.use(
  response => {
    console.log('✅ Response:', response.status, response.config.url);
    
    // Store session on login
    if (response.config.url.includes('/auth/login') && response.data?.user?._id) {
      const userId = response.data.user._id;
      const timestamp = Date.now();
      const sessionToken = btoa(userId + ':' + timestamp);
      
      localStorage.setItem('sessionId', sessionToken);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userRole', response.data.user.role);
      
      console.log('✅ Login - Session stored');
      console.log('🔑 Session token:', sessionToken.substring(0, 15) + '...');
    }
    
    return response;
  },
  error => {
    console.error('❌ Error:', error.response?.status, error.config?.url);
    console.error('❌ Error details:', error.message);
    
    if (error.response?.status === 401) {
      console.log('🚫 401 - Clearing session');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
    }
    
    return Promise.reject(error);
  }
);

export default api;