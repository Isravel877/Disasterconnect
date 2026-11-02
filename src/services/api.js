import axios from "axios";

// Keep the backend URL in one place. You can override it at build time with
// VITE_API_BASE_URL in a .env file.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://disasterconnect-env.eba-un8ixjpz.us-east-2.elasticbeanstalk.com";

const api = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the JWT to every protected API request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function loginUser(credentials) {
  const response = await api.post("/api/auth/login", credentials);
  return response.data;
}

export default api;
