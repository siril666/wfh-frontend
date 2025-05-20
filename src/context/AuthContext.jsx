import { createContext, useContext, useState, useEffect } from 'react';
import { getProfile, userLogin } from '../api/apiService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  console.log("inside the context module");

  const fetchUser = async () => {
    try {
      
      const token = localStorage.getItem('accessToken');
      if (token) {
        const response = await getProfile();
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Check auth state on mount
  useEffect(() => {    
    fetchUser();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await userLogin(credentials);
      localStorage.setItem('accessToken', response.data.accessToken);
      await fetchUser(); // Fetch and set user after successful login
      return response.data;
    } catch (error) {
      localStorage.removeItem('accessToken');
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout,
      fetchUser // Export fetchUser if needed for manual refreshes
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => { 
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};