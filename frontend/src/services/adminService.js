import { api } from "./api";

export const adminService = {
  getOverview: () => api.get("/admin/overview"),
  createAdminUser: (payload) => api.post("/admin/admin-users", payload),

  getQuestions: () => api.get("/admin/questions"),
  createQuestion: (payload) => api.post("/admin/questions", payload),
  updateQuestion: (id, payload) => api.put(`/admin/questions/${id}`, payload),
  deleteQuestion: (id) => api.delete(`/admin/questions/${id}`),

  getSkills: () => api.get("/admin/skills"),
  createSkill: (payload) => api.post("/admin/skills", payload),
  updateSkill: (id, payload) => api.put(`/admin/skills/${id}`, payload),
  deleteSkill: (id) => api.delete(`/admin/skills/${id}`),

  getCompanies: () => api.get("/admin/companies"),
  createCompany: (payload) => api.post("/admin/companies", payload),
  updateCompany: (id, payload) => api.put(`/admin/companies/${id}`, payload),
  deleteCompany: (id) => api.delete(`/admin/companies/${id}`),
};
