import { api } from "./api";

export const quizService = {
  getQuestions: (params) => api.get("/quiz/questions", { params }),
  saveResult: (payload) => api.post("/quiz/result", payload),
  getResults: () => api.get("/quiz/results"),
  getLeaderboard: () => api.get("/quiz/leaderboard"),
  getSkillTracker: () => api.get("/quiz/skill-tracker"),
};
