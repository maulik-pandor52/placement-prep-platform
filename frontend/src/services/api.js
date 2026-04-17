import axios from "axios";

const fallbackBaseUrl = "http://localhost:5000/api";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl
).replace(/\/$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const buildApiUrl = (path) => `${API_BASE_URL}${path}`;
