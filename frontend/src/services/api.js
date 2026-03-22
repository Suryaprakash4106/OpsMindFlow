import axios from 'axios';

// ✅ Backend URL
const API_URL = 'https://opsmindflow.onrender.com';
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
    console.log('✅ Added X-User-ID header');
  }
  
  return request;
});

// ✅ RESPONSE INTERCEPTOR
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
      localStorage.setItem('userName', response.data.user.name);
      
      console.log('✅ Login - Session stored in localStorage');
    }
    return response;
  },
  error => {
    console.error('❌ Error:', error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);

// ✅ Helper to check if user is logged in (for refresh)
export const isAuthenticated = () => {
  return !!localStorage.getItem('sessionId');
};

// ✅ Helper to get current user on page refresh
export const getCurrentUser = () => {
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName');
  
  if (userId) {
    return {
      _id: userId,
      role: userRole,
      name: userName
    };
  }
  return null;
};

// ✅ Helper to restore session on page load
export const restoreSession = async () => {
  const userId = localStorage.getItem('userId');
  const sessionId = localStorage.getItem('sessionId');
  
  if (!userId || !sessionId) {
    return null;
  }
  
  try {
    // Verify session with backend
    const response = await api.get('/auth/me');
    if (response.data) {
      console.log('✅ Session restored for user:', response.data.name);
      return response.data;
    }
  } catch (error) {
    console.log('❌ Session expired, clearing localStorage');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    return null;
  }
};

export default api;