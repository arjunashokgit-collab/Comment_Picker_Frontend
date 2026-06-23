import { createContext, useContext, useMemo, useState } from 'react';
import { clearStoredAuth, loginAPI, registerAPI, setStoredAuth } from '../services/allAPI';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const user = localStorage.getItem('commentPickerUser');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('commentPickerToken') || '');
  const [user, setUser] = useState(readStoredUser);

  const saveSession = (sessionToken, sessionUser) => {
    setToken(sessionToken);
    setUser(sessionUser);
    setStoredAuth({
      token: sessionToken,
      user: sessionUser,
    });
  };

  const login = async (credentials) => {
    const response = await loginAPI(credentials);
    const payload = response.data?.data;

    if (!payload?.token || !payload?.user) {
      throw new Error('Invalid login response from server');
    }

    saveSession(payload.token, payload.user);
    return payload;
  };

  const register = async (formData) => {
    const response = await registerAPI(formData);
    const payload = response.data?.data;

    if (payload?.token && payload?.user) {
      saveSession(payload.token, payload.user);
    }

    return payload;
  };

  const logout = () => {
    setToken('');
    setUser(null);
    clearStoredAuth();
  };

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      login,
      logout,
      register,
      token,
      user,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
