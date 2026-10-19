import { useContext } from "react";
import { AuthContext } from "../auth.context.jsx";
import { login, logout, register, googleLogin } from "../services/auth.api.js";
import { useContext, useCallback } from "react";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { user, loading, setUser, setLoading, refreshUser } = context;

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const data = await login({ email, password });
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (username, email, password) => {
    setLoading(true);
    try {
      const data = await register({ username, email, password });
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useCallback(
    async (credential) => {
      setLoading(true);
      try {
        const data = await googleLogin(credential);
        setUser(data.user);
        return data.user;
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading],
  );

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    handleLogin,
    handleRegister,
    handleLogout,
    refreshUser,
    handleGoogleLogin,
  };
};
