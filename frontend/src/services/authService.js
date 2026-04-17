import { api } from "./api";

export const authService = {
  studentLogin: (payload) => api.post("/auth/login", payload),
  studentRegister: (payload) => api.post("/auth/register", payload),
  adminLogin: (payload) => api.post("/auth/admin/login", payload),
  adminRegister: (payload) => api.post("/auth/admin/register", payload),
  getProfile: () => api.get("/auth/profile"),
};
