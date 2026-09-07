import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context.jsx";
import { login, logout, register, getUser } from "../services/auth.api.js";

export const useAuth = () => {
  const { user, loading, setUser, setLoading } = useContext(AuthContext);

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const userData = await login({ email, password });
      setUser(userData);
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleregister = async (username, email, password) => {
    setLoading(true);
    try {
      const userData = await register({ username, email, password });
      setUser(userData);
    } catch (error) {
      console.error("Register failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    handleLogin,
    handleregister,
    handleLogout,
  };
};
