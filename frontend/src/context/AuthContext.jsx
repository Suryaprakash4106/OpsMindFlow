import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // ✅ Get stored session data from localStorage
        const sessionId = localStorage.getItem('sessionId');
        const userId = localStorage.getItem('userId');
        
        // If no session data, just set loading false
        if (!sessionId || !userId) {
          setLoading(false);
          return;
        }
        
        // ✅ Call /auth/me with headers to verify session
        const { data } = await api.get('/auth/me', {
          headers: {
            'X-Session-ID': sessionId,
            'X-User-ID': userId
          }
        });
        setUser(data);
      } catch (error) {
        console.error('Fetch user error:', error);
        setUser(null);
        // Clear invalid session data
        localStorage.removeItem('sessionId');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    // Clear all session data on logout
    localStorage.removeItem('sessionId');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};