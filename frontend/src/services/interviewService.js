import { api, buildApiUrl } from "./api";

export const interviewService = {
  getHistory: () => api.get("/interview/history"),
  getQuestions: (params) => api.get("/interview/questions", { params }),
  saveSession: (payload) => api.post("/interview/sessions", payload),
  uploadUrl: () => buildApiUrl("/interview/upload"),
};
