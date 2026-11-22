import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('smart_mess_token');
      const savedUser = localStorage.getItem('smart_mess_user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Validate and refresh profile from backend
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            setUser(res.data.data);
            localStorage.setItem('smart_mess_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Session verification failed, clearing auth storage');
          localStorage.removeItem('smart_mess_token');
          localStorage.removeItem('smart_mess_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Student specific login
  const loginStudent = async (email, password) => {
    const res = await api.post('/auth/student-login', { email, password });
    if (res.data?.success) {
      const userData = res.data.data;
      localStorage.setItem('smart_mess_token', userData.token);
      localStorage.setItem('smart_mess_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
    throw new Error(res.data?.message || 'Student login failed');
  };

  // Admin / Mess Bhaiya specific login
  const loginAdmin = async (email, password) => {
    const res = await api.post('/auth/admin-login', { email, password });
    if (res.data?.success) {
      const userData = res.data.data;
      localStorage.setItem('smart_mess_token', userData.token);
      localStorage.setItem('smart_mess_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
    throw new Error(res.data?.message || 'Admin login failed');
  };

  // General login fallback
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success) {
      const userData = res.data.data;
      localStorage.setItem('smart_mess_token', userData.token);
      localStorage.setItem('smart_mess_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  // Student registration
  const registerStudent = async (studentData) => {
    const res = await api.post('/auth/register', studentData);
    if (res.data?.success) {
      const userData = res.data.data;
      localStorage.setItem('smart_mess_token', userData.token);
      localStorage.setItem('smart_mess_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
    throw new Error(res.data?.message || 'Student registration failed');
  };

  // Authorized Admin creating another Admin account
  const createAdmin = async (adminData) => {
    const res = await api.post('/auth/create-admin', adminData);
    if (res.data?.success) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to create admin account');
  };

  // Request password reset token
  const requestForgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    if (res.data?.success) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to request password reset');
  };

  // Reset password using token
  const executeResetPassword = async (token, newPassword) => {
    const res = await api.post(`/auth/reset-password/${token}`, { password: newPassword });
    if (res.data?.success) {
      if (res.data.data?.token) {
        localStorage.setItem('smart_mess_token', res.data.data.token);
        localStorage.setItem('smart_mess_user', JSON.stringify(res.data.data));
        setUser(res.data.data);
      }
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to reset password');
  };

  // Quick demo switcher for instant evaluation
  const demoLogin = async (role = 'student') => {
    if (role === 'admin') {
      return await loginAdmin('bhaiya@smartmess.in', 'password123');
    }
    return await loginStudent('rahul@student.in', 'password123');
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('smart_mess_token');
    localStorage.removeItem('smart_mess_user');
    setUser(null);
  };

  // Update profile
  const updateUser = (updatedData) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedData };
      localStorage.setItem('smart_mess_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginStudent,
        loginAdmin,
        registerStudent,
        createAdmin,
        requestForgotPassword,
        executeResetPassword,
        demoLogin,
        logout,
        updateUser,
        isAdmin: user?.role === 'admin' || user?.role === 'staff',
        isStudent: user?.role === 'student',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
