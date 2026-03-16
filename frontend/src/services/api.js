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

// 🔥 CRITICAL FIX: Store session ID in localStorage and send as header
api.interceptors.request.use(request => {
  // Get session ID from localStorage if exists
  const sessionId = localStorage.getItem('sessionId');
  if (sessionId) {
    request.headers['X-Session-ID'] = sessionId;
    console.log('🔑 Adding session header:', sessionId.substring(0, 10) + '...');
  }
  
  // Also get userId if needed
  const userId = localStorage.getItem('userId');
  if (userId) {
    request.headers['X-User-ID'] = userId;
  }
  
  console.log('🚀 Request:', {
    url: request.url,
    method: request.method,
    withCredentials: request.withCredentials,
    hasSessionHeader: !!sessionId,
    cookies: document.cookie || 'No cookies'
  });
  return request;
});

// 🔥 Store session ID from login response
api.interceptors.response.use(
  response => {
    // Check if this is a login response
    if (response.config.url.includes('/auth/login') && response.data?.user?._id) {
      // Generate a simple session token (combination of userId + timestamp)
      const userId = response.data.user._id;
      const timestamp = Date.now();
      const sessionToken = btoa(userId + ':' + timestamp); // base64 encode
      
      // Store in localStorage
      localStorage.setItem('sessionId', sessionToken);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userRole', response.data.user.role);
      
      console.log('✅ Session stored in localStorage for user:', userId);
      console.log('🔑 Session token:', sessionToken.substring(0, 15) + '...');
    }
    
    console.log('✅ Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.log('❌ Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message
    });
    
    // If 401, clear session
    if (error.response?.status === 401) {
      console.log('🚫 Clearing session due to 401');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to check if user is logged in
export const isAuthenticated = () => {
  return !!localStorage.getItem('sessionId');
};

// Helper function to get current user ID
export const getCurrentUserId = () => {
  return localStorage.getItem('userId');
};

// Helper function to logout
export const logout = () => {
  localStorage.removeItem('sessionId');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
  // Optionally redirect to login
  window.location.href = '/login';
};

export default api;