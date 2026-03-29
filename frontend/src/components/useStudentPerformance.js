import { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function useStudentPerformance({ navigate }) {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [skillTracker, setSkillTracker] = useState({
    trackedSkills: [],
    recommendedFocus: [],
    peerComparison: {
      cohortSize: 0,
      averageScore: 0,
      yourScore: 0,
      percentile: 0,
      rank: 0,
      strengthsVsPeers: [],
      needsVsPeers: [],
      skillComparison: [],
    },
    industryTrends: [],
  });
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [resultsRes, leaderboardRes, skillTrackerRes, interviewHistoryRes] =
          await Promise.all([
            axios.get("http://localhost:5000/api/quiz/results", {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            }),
            axios.get("http://localhost:5000/api/quiz/leaderboard", {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            }),
            axios.get("http://localhost:5000/api/quiz/skill-tracker", {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            }),
            axios.get("http://localhost:5000/api/interview/history", {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            }),
          ]);

        const sorted = [...(resultsRes.data || [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );

        setResults(sorted);
        setLeaderboard(leaderboardRes.data || []);
        setSkillTracker(
          skillTrackerRes.data || {
            trackedSkills: [],
            recommendedFocus: [],
            peerComparison: {
              cohortSize: 0,
              averageScore: 0,
              yourScore: 0,
              percentile: 0,
              rank: 0,
              strengthsVsPeers: [],
              needsVsPeers: [],
              skillComparison: [],
            },
            industryTrends: [],
          },
        );
        setInterviewHistory(interviewHistoryRes.data || []);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        } else {
          setError(
            err.response?.data?.message ||
              "Could not load your dashboard. Please try again later.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [navigate]);

  const stats = useMemo(() => {
    if (!results.length) {
      return {
        totalQuizzes: 0,
        highestScore: 0,
        averageScore: "0.0",
        performance: "No attempts yet",
      };
    }

    const scores = results.map((r) => r.score);
    const totalQuizzes = results.length;
    const highestScore = Math.max(...scores);
    const averageScore = (
      scores.reduce((sum, score) => sum + score, 0) / totalQuizzes
    ).toFixed(1);

    const averagePercentage =
      results.reduce((sum, item) => sum + (item.score / (item.total || 1)) * 100, 0) /
      totalQuizzes;

    let performance = "Needs Practice";
    if (averagePercentage >= 80) performance = "Excellent";
    else if (averagePercentage >= 65) performance = "Good";
    else if (averagePercentage >= 50) performance = "Average";

    return {
      totalQuizzes,
      highestScore,
      averageScore,
      performance,
    };
  }, [results]);

  const latestReport = results[0]?.report || {};
  const latestPoints = latestReport.totalPoints || currentUser?.points || 0;
  const latestBadges = latestReport.badgesEarned || currentUser?.badges || [];

  return {
    currentUser,
    results,
    leaderboard,
    skillTracker,
    interviewHistory,
    loading,
    error,
    stats,
    latestReport,
    latestPoints,
    latestBadges,
  };
}
