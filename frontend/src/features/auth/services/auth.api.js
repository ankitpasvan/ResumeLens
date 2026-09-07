import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

// Register a new user
export async function register({ username, email, password }) {
  try {
    const response = await api.post(
      "/api/auth/register",
      {
        username,
        email,
        password,
      },
      {
        withCredentials: true,
      },
    );

    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Registration failed";

    throw new Error(message);
  }
}

// Login an existing user

export async function login({ email, password }) {
  try {
    const response = await api.post(
      "/api/auth/login",
      {
        email,
        password,
      },
      {
        withCredentials: true,
      },
    );
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Login failed";
    throw new Error(message);
  }
}

// Logout the current user

export async function logout() {
  try {
    const response = await api.post(
      "/api/auth/logout",
      {},
      {
        withCredentials: true,
      },
    );
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Logout failed";
    throw new Error(message);
  }
}

export async function getUser() {
  try {
    const response = await api.get("/api/auth/user");

    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to get user";

    throw new Error(message);
  }
}
