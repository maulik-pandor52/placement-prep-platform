const fs = require("fs");
const path = require("path");
const InterviewSession = require("../models/InterviewSession");

const uploadsDir = path.join(__dirname, "..", "uploads", "interviews");
fs.mkdirSync(uploadsDir, { recursive: true });

const interviewBank = {
  default: [
    {
      question: "Tell me about yourself and how your current technical skills fit this role.",
      topic: "Communication",
      keywords: ["skills", "project", "experience", "role"],
    },
    {
      question: "Describe a project where you solved a difficult problem. What approach did you take?",
      topic: "Problem Solving",
      keywords: ["problem", "approach", "result", "solution"],
    },
    {
      question: "How do you keep your technical knowledge current when tools and frameworks change quickly?",
      topic: "Learning Agility",
      keywords: ["learn", "update", "practice", "project"],
    },
  ],
  React: [
    {
      question: "How would you explain React component state and props to a teammate?",
      topic: "React Fundamentals",
      keywords: ["state", "props", "component", "data"],
    },
    {
      question: "What steps would you take to optimize a slow React page?",
      topic: "React Performance",
      keywords: ["render", "performance", "optimize", "profiling"],
    },
  ],
  "Node.js": [
    {
      question: "How do you structure error handling in a Node.js API?",
      topic: "Backend Fundamentals",
      keywords: ["middleware", "error", "response", "logging"],
    },
    {
      question: "What makes asynchronous programming important in Node.js?",
      topic: "Async Programming",
      keywords: ["async", "await", "event loop", "non-blocking"],
    },
  ],
  Aptitude: [
    {
      question: "How do you stay calm and accurate when solving timed aptitude problems?",
      topic: "Aptitude Strategy",
      keywords: ["time", "accuracy", "practice", "strategy"],
    },
  ],
};

const companyPrompts = {
  Infosys: "How would you communicate progress clearly while working in a structured service-based team?",
  "Tata Consultancy Services":
    "How would you adapt quickly when a client project changes scope or priorities?",
  Tatvasoft:
    "How would you contribute to a web project where delivery speed and code quality both matter?",
};

const getQuestionsForSession = ({ skill, company }) => {
  const selected = [];
  const normalizedSkill = skill?.trim();
  const normalizedCompany = company?.trim();

  if (normalizedSkill && interviewBank[normalizedSkill]) {
    selected.push(...interviewBank[normalizedSkill]);
  }

  selected.push(...interviewBank.default);

  if (normalizedCompany && companyPrompts[normalizedCompany]) {
    selected.push({
      question: companyPrompts[normalizedCompany],
      topic: `${normalizedCompany} Readiness`,
      keywords: ["team", "delivery", "communication", "adapt"],
    });
  }

  return selected.slice(0, 5);
};

const scoreAnswer = ({ answer = "", keywords = [] }) => {
  const normalized = answer.trim().toLowerCase();
  if (!normalized) {
    return { score: 0, feedback: "Add a more complete answer with examples and outcomes." };
  }

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const lengthScore = Math.min(wordCount / 40, 1) * 45;
  const keywordHits = keywords.filter((item) => normalized.includes(item.toLowerCase())).length;
  const keywordScore = keywords.length ? (keywordHits / keywords.length) * 55 : 35;
  const score = Math.round(lengthScore + keywordScore);

  let feedback = "Good start. Add one concrete example to make your answer stronger.";
  if (score >= 80) {
    feedback = "Strong answer. You explained your thinking clearly and used relevant terms.";
  } else if (score >= 60) {
    feedback = "Decent answer. Add clearer structure and one measurable outcome.";
  } else if (score >= 40) {
    feedback = "Needs more depth. Mention your approach, tools, and final result.";
  }

  return { score, feedback };
};

const scoreDelivery = ({
  responseSeconds = 0,
  usedCamera = false,
  videoDurationSeconds = 0,
}) => {
  let score = 25;

  if (usedCamera) {
    score += 25;
  }

  if (responseSeconds >= 30) {
    score += 20;
  } else if (responseSeconds >= 15) {
    score += 10;
  }

  if (videoDurationSeconds >= 25) {
    score += 20;
  } else if (videoDurationSeconds >= 10) {
    score += 10;
  }

  if (responseSeconds <= 120) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
};

const scoreFacialSignals = ({ facialMetrics = {}, usedCamera = false }) => {
  const totalSamples = Number(facialMetrics.totalSamples) || 0;
  const faceVisibleSamples = Number(facialMetrics.faceVisibleSamples) || 0;
  const centeredSamples = Number(facialMetrics.centeredSamples) || 0;
  const stableSamples = Number(facialMetrics.stableSamples) || 0;
  const supported = Boolean(facialMetrics.supported);

  if (!usedCamera || !supported || !totalSamples) {
    return {
      confidenceScore: usedCamera ? 45 : 0,
      confusionScore: usedCamera ? 20 : 0,
      expressionSummary: usedCamera
        ? "Camera recording was available, but facial tracking data was limited."
        : "No camera-based facial analysis available for this answer.",
      supported,
    };
  }

  const visibleRate = faceVisibleSamples / totalSamples;
  const centeredRate = centeredSamples / Math.max(faceVisibleSamples, 1);
  const stableRate = stableSamples / Math.max(faceVisibleSamples, 1);

  const confidenceScore = Math.round(
    Math.min(100, visibleRate * 40 + centeredRate * 35 + stableRate * 25),
  );
  const confusionScore = Math.round(
    Math.min(
      100,
      (1 - visibleRate) * 35 + (1 - centeredRate) * 30 + (1 - stableRate) * 35,
    ),
  );

  let expressionSummary = "Camera presence looked moderately steady.";
  if (confidenceScore >= 75) {
    expressionSummary = "Face position and eye-line looked steady, suggesting confident delivery.";
  } else if (confusionScore >= 55) {
    expressionSummary = "Frequent face loss or movement suggested some uncertainty or distraction.";
  }

  return {
    confidenceScore,
    confusionScore,
    expressionSummary,
    supported,
  };
};

exports.uploadInterviewClip = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.body || !req.body.length) {
      return res.status(400).json({ message: "No recording data received" });
    }

    const questionIndex = Number(req.headers["x-question-index"] || 0);
    const ext = String(req.headers["x-file-ext"] || "webm").replace(/[^a-z0-9]/gi, "") || "webm";
    const filename = `${req.user.id}-${Date.now()}-${questionIndex}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filePath, req.body);

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.status(201).json({
      message: "Recording uploaded successfully",
      videoUrl: `${baseUrl}/uploads/interviews/${filename}`,
      filename,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getInterviewQuestions = async (req, res) => {
  try {
    const { skill = "", company = "", role = "" } = req.query;
    const questions = getQuestionsForSession({ skill, company }).map((item, index) => ({
      id: index + 1,
      question: item.question,
      topic: item.topic,
      role,
    }));

    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveInterviewSession = async (req, res) => {
  try {
    const {
      company = "",
      role = "",
      skill = "",
      answers = [],
      interviewMode = "text",
      videoSummary = {},
    } = req.body;

    const questionSet = getQuestionsForSession({ skill, company });
    const scoredAnswers = questionSet.map((item, index) => {
      const submittedAnswer = answers[index] || {};
      const submitted = submittedAnswer.answer || "";
      const contentResult = scoreAnswer({
        answer: submitted,
        keywords: item.keywords,
      });
      const deliveryScore = scoreDelivery({
        responseSeconds: Number(submittedAnswer.responseSeconds) || 0,
        usedCamera: Boolean(submittedAnswer.usedCamera),
        videoDurationSeconds: Number(submittedAnswer.videoDurationSeconds) || 0,
      });
      const facialSignals = scoreFacialSignals({
        facialMetrics: submittedAnswer.facialMetrics || {},
        usedCamera: Boolean(submittedAnswer.usedCamera),
      });
      const score =
        interviewMode === "video"
          ? Math.round(
              contentResult.score * 0.65 +
                deliveryScore * 0.2 +
                facialSignals.confidenceScore * 0.15,
            )
          : contentResult.score;

      const feedback =
        interviewMode === "video"
          ? `${contentResult.feedback} Delivery score: ${deliveryScore}. Facial confidence signal: ${facialSignals.confidenceScore}.`
          : contentResult.feedback;

      return {
        question: item.question,
        answer: submitted,
        score,
        feedback,
        topic: item.topic,
        responseSeconds: Number(submittedAnswer.responseSeconds) || 0,
        usedCamera: Boolean(submittedAnswer.usedCamera),
        videoDurationSeconds: Number(submittedAnswer.videoDurationSeconds) || 0,
        deliveryScore,
        videoUrl: submittedAnswer.videoUrl || "",
        confidenceScore: facialSignals.confidenceScore,
        confusionScore: facialSignals.confusionScore,
        expressionSummary: facialSignals.expressionSummary,
      };
    });

    const contentScore = scoredAnswers.length
      ? Math.round(
          scoredAnswers.reduce((sum, item) => sum + scoreAnswer({
            answer: item.answer,
            keywords:
              questionSet.find((question) => question.question === item.question)?.keywords || [],
          }).score, 0) / scoredAnswers.length,
        )
      : 0;

    const deliveryScore = scoredAnswers.length
      ? Math.round(
          scoredAnswers.reduce((sum, item) => sum + (item.deliveryScore || 0), 0) /
            scoredAnswers.length,
        )
      : 0;

    const confidenceScore = scoredAnswers.length
      ? Math.round(
          scoredAnswers.reduce((sum, item) => sum + (item.confidenceScore || 0), 0) /
            scoredAnswers.length,
        )
      : 0;

    const confusionScore = scoredAnswers.length
      ? Math.round(
          scoredAnswers.reduce((sum, item) => sum + (item.confusionScore || 0), 0) /
            scoredAnswers.length,
        )
      : 0;

    const faceTrackingSupported = answers.some(
      (item) => Boolean(item.facialMetrics?.supported),
    );

    let expressionSummary = "Facial analysis was not available for this session.";
    if (faceTrackingSupported) {
      expressionSummary =
        confidenceScore >= 70
          ? "Camera analysis suggests a confident and steady interview presence."
          : confusionScore >= 55
            ? "Camera analysis suggests moments of uncertainty or distraction."
            : "Camera analysis suggests a fairly balanced interview presence.";
    } else if (interviewMode === "video") {
      expressionSummary =
        "Video was recorded, but advanced face tracking was not supported in this browser.";
    }

    const overallScore = scoredAnswers.length
      ? Math.round(
          scoredAnswers.reduce((sum, item) => sum + item.score, 0) / scoredAnswers.length,
        )
      : 0;

    const strengths = scoredAnswers
      .filter((item) => item.score >= 70)
      .slice(0, 3)
      .map((item) => item.topic);

    const improvements = scoredAnswers
      .filter((item) => item.score < 60)
      .slice(0, 3)
      .map((item) => item.topic);

    const tips = [];
    if (strengths[0]) {
      tips.push(`Keep using clear examples when discussing ${strengths[0]}.`);
    }
    if (improvements[0]) {
      tips.push(`Practice shorter, more structured responses for ${improvements[0]}.`);
    }
    if (company) {
      tips.push(`Research recent ${company} projects so your answers feel more company-specific.`);
    }
    if (interviewMode === "video") {
      tips.push("Review your recording posture, eye contact, and answer pacing after each session.");
      if (confusionScore >= 55) {
        tips.push("Reduce uncertain moments by pausing briefly before answering and keeping your face centered.");
      }
      if (confidenceScore >= 70) {
        tips.push("Your camera presence looked steady. Keep using that calm posture in future rounds.");
      }
    }
    if (!tips.length) {
      tips.push("Keep practicing concise STAR-style answers with clear outcomes.");
    }

    const safeVideoSummary = {
      cameraEnabled: Boolean(videoSummary.cameraEnabled),
      recordingsCount: Number(videoSummary.recordingsCount) || 0,
      totalRecordedSeconds: Number(videoSummary.totalRecordedSeconds) || 0,
    };

    const session = await InterviewSession.create({
      userId: req.user.id,
      company: company.trim(),
      role: role.trim(),
      skill: skill.trim(),
      interviewMode: interviewMode === "video" ? "video" : "text",
      overallScore,
      contentScore,
      deliveryScore,
      confidenceScore,
      confusionScore,
      expressionSummary,
      strengths,
      improvements,
      tips,
      answers: scoredAnswers,
      videoSummary: safeVideoSummary,
      facialInsights: {
        faceTrackingSupported,
        averageConfidence: confidenceScore,
        averageConfusion: confusionScore,
        summary: expressionSummary,
      },
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getInterviewHistory = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
