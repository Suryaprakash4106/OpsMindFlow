import { createContext, useContext, useState, useEffect } from 'react';
import api, { restoreSession, getCurrentUser } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      
      // ✅ First, check localStorage for saved session
      const savedUser = getCurrentUser();
      if (savedUser) {
        setUser(savedUser);
      }
      
      // ✅ Then verify with backend
      try {
        const restoredUser = await restoreSession();
        if (restoredUser) {
          setUser(restoredUser);
        } else if (savedUser) {
          // If localStorage had user but backend doesn't, clear it
          localStorage.removeItem('sessionId');
          localStorage.removeItem('userId');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userName');
          setUser(null);
        }
      } catch (error) {
        console.error('Session restore error:', error);
        setUser(null);
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
    // ✅ Clear localStorage on logout
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