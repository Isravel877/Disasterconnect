
import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://disasterconnect-env.eba-un8ixjpz.us-east-2.elasticbeanstalk.com"
).trim().replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT only to protected API requests.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token && !config.url?.startsWith("/api/auth/")) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function loginUser(credentials) {
  const response = await api.post("/api/auth/login", credentials);
  return response.data;
}

export default api;
