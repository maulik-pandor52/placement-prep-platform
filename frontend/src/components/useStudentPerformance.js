import { useEffect, useMemo, useState } from "react";
import { interviewService } from "../services/interviewService";
import { quizService } from "../services/quizService";

export default function useStudentPerformance({ navigate }) {
  const defaultCombinedAnalytics = {
    quizCount: 0,
    interviewCount: 0,
    quizAverage: 0,
    interviewAverage: 0,
    combinedScore: 0,
    weightedScore: 0,
    percentage: 0,
    performanceLevel: "Beginner",
    readinessScore: 0,
    progressCheck: {
      currentCombined: 0,
      previousCombined: null,
      delta: null,
    },
    sectionBreakdown: {
      quiz: 0,
      interview: 0,
    },
    companyRecommendations: [],
  };

  const defaultActivitySummary = {
    totalActiveDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDay: "",
    calendar: [],
  };

  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    currentUser = null;
  }
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [skillTracker, setSkillTracker] = useState({
    trackedSkills: [],
    recommendedFocus: [],
    userStats: {
      points: 0,
      badges: [],
      totalQuizzes: 0,
    },
    activitySummary: defaultActivitySummary,
    combinedAnalytics: defaultCombinedAnalytics,
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

        const defaultSkillTracker = {
          trackedSkills: [],
          recommendedFocus: [],
          userStats: {
            points: 0,
            badges: [],
            totalQuizzes: 0,
          },
          activitySummary: defaultActivitySummary,
          combinedAnalytics: defaultCombinedAnalytics,
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
        };

        const requests = await Promise.allSettled([
          quizService.getResults(),
          quizService.getLeaderboard(),
          quizService.getSkillTracker(),
          interviewService.getHistory(),
        ]);

        const [resultsRes, leaderboardRes, skillTrackerRes, interviewHistoryRes] = requests;

        const authFailures = requests.filter(
          (request) =>
            request.status === "rejected" &&
            (request.reason?.response?.status === 401 ||
              request.reason?.response?.status === 403),
        );

        const successfulRequests = requests.filter(
          (request) => request.status === "fulfilled",
        );

        if (authFailures.length && successfulRequests.length === 0) {
          setResults([]);
          setLeaderboard([]);
          setInterviewHistory([]);
          setSkillTracker(defaultSkillTracker);
          setError("Your session data could not be verified. Please refresh once or sign in again if the issue continues.");
          return;
        }

        const partialErrors = [];

        if (resultsRes.status === "fulfilled") {
          const sorted = [...(resultsRes.value.data || [])].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          );
          setResults(sorted);
        } else {
          setResults([]);
          partialErrors.push("quiz results");
        }

        if (leaderboardRes.status === "fulfilled") {
          setLeaderboard(leaderboardRes.value.data || []);
        } else {
          setLeaderboard([]);
          partialErrors.push("leaderboard");
        }

        if (skillTrackerRes.status === "fulfilled") {
          setSkillTracker(skillTrackerRes.value.data || defaultSkillTracker);
        } else {
          setSkillTracker(defaultSkillTracker);
          partialErrors.push("performance analytics");
        }

        if (interviewHistoryRes.status === "fulfilled") {
          setInterviewHistory(interviewHistoryRes.value.data || []);
        } else {
          setInterviewHistory([]);
          partialErrors.push("interview history");
        }

        if (partialErrors.length) {
          setError(
            `Some dashboard sections could not load: ${partialErrors.join(", ")}.`,
          );
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Could not load your dashboard. Please try again later.",
        );
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
  const safeUserStats = skillTracker?.userStats || {
    points: 0,
    badges: [],
    totalQuizzes: 0,
  };
  const safeActivitySummary = {
    ...defaultActivitySummary,
    ...(skillTracker?.activitySummary || {}),
  };
  const safeCombinedAnalytics = {
    ...defaultCombinedAnalytics,
    ...(skillTracker?.combinedAnalytics || {}),
    progressCheck: {
      ...defaultCombinedAnalytics.progressCheck,
      ...(skillTracker?.combinedAnalytics?.progressCheck || {}),
    },
    sectionBreakdown: {
      ...defaultCombinedAnalytics.sectionBreakdown,
      ...(skillTracker?.combinedAnalytics?.sectionBreakdown || {}),
    },
    companyRecommendations:
      skillTracker?.combinedAnalytics?.companyRecommendations || [],
  };
  const latestPoints =
    latestReport.totalPoints || safeUserStats.points || currentUser?.points || 0;
  const latestBadges =
    safeUserStats.badges || latestReport.badgesEarned || currentUser?.badges || [];

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
    activitySummary: safeActivitySummary,
    combinedAnalytics: safeCombinedAnalytics,
  };
}
