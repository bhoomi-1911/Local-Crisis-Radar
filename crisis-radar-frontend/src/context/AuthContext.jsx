import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cr_token');

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((response) => {
        setUser(response.data.user);
      })
      .catch(() => {
        localStorage.removeItem('cr_token');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });

    localStorage.setItem('cr_token', response.data.token);
    setUser(response.data.user);

    return response.data.user;
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
    });

    localStorage.setItem('cr_token', response.data.token);
    setUser(response.data.user);

    return response.data.user;
  };

  const logout = () => {
    localStorage.removeItem('cr_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}