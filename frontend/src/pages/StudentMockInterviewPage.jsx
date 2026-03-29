import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StudentLayout from "../components/StudentLayout";

const interviewDefaults = {
  company: "Infosys",
  role: "Frontend Developer",
  skill: "React",
};

const QUESTION_TIMER_SECONDS = 90;

export default function StudentMockInterviewPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const questionStartRef = useRef(0);
  const recordingStartedAtRef = useRef(0);
  const faceDetectorRef = useRef(null);
  const analysisIntervalRef = useRef(null);

  const [form, setForm] = useState(interviewDefaults);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_SECONDS);
  const [uploadingClip, setUploadingClip] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    axios
      .get("http://localhost:5000/api/interview/history", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setHistory(res.data || []))
      .catch(() => setError("Could not load interview history."))
      .finally(() => setLoading(false));
  }, [navigate, token]);

  useEffect(() => {
    if (!questions.length) {
      return undefined;
    }

    questionStartRef.current = Date.now();
    setTimeLeft(QUESTION_TIMER_SECONDS);

    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - questionStartRef.current) / 1000);
      const remaining = Math.max(QUESTION_TIMER_SECONDS - elapsed, 0);
      setTimeLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        stopRecording();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeQuestion, questions.length]);

  useEffect(() => {
    const attachPreview = async () => {
      if (!cameraReady || !videoRef.current || !mediaStreamRef.current) {
        return;
      }

      try {
        videoRef.current.srcObject = mediaStreamRef.current;
        await videoRef.current.play();
      } catch {
        setError("Camera started, but the live preview could not be shown.");
      }
    };

    attachPreview();
  }, [cameraReady]);

  useEffect(() => () => {
    stopRecording();
    stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      setCameraLoading(true);
      setError("");

      if (mediaStreamRef.current) {
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      mediaStreamRef.current = stream;
      setCameraReady(true);

      if ("FaceDetector" in window) {
        faceDetectorRef.current = new window.FaceDetector({
          fastMode: true,
          maxDetectedFaces: 1,
        });
      }
    } catch {
      setError("Could not access your camera and microphone. Please allow permissions.");
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (analysisIntervalRef.current) {
      window.clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  };

  const startFaceTracking = (questionIndex) => {
    if (analysisIntervalRef.current) {
      window.clearInterval(analysisIntervalRef.current);
    }

    if (!faceDetectorRef.current || !videoRef.current) {
      return;
    }

    analysisIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        return;
      }

      try {
        const faces = await faceDetectorRef.current.detect(videoRef.current);
        const face = faces[0];

        setAnswers((prev) =>
          prev.map((item, index) => {
            if (index !== questionIndex) {
              return item;
            }

            const currentMetrics = item.facialMetrics || {
              supported: true,
              totalSamples: 0,
              faceVisibleSamples: 0,
              centeredSamples: 0,
              stableSamples: 0,
              lastCenterX: 0,
              lastCenterY: 0,
            };

            const nextMetrics = {
              ...currentMetrics,
              supported: true,
              totalSamples: currentMetrics.totalSamples + 1,
            };

            if (face?.boundingBox) {
              nextMetrics.faceVisibleSamples += 1;

              const videoWidth = videoRef.current.videoWidth || 1;
              const videoHeight = videoRef.current.videoHeight || 1;
              const faceCenterX = face.boundingBox.x + face.boundingBox.width / 2;
              const faceCenterY = face.boundingBox.y + face.boundingBox.height / 2;
              const centered =
                Math.abs(faceCenterX - videoWidth / 2) < videoWidth * 0.18 &&
                Math.abs(faceCenterY - videoHeight / 2) < videoHeight * 0.18;

              if (centered) {
                nextMetrics.centeredSamples += 1;
              }

              const previousX = currentMetrics.lastCenterX || faceCenterX;
              const previousY = currentMetrics.lastCenterY || faceCenterY;
              const movement = Math.hypot(faceCenterX - previousX, faceCenterY - previousY);

              if (movement < Math.min(videoWidth, videoHeight) * 0.08) {
                nextMetrics.stableSamples += 1;
              }

              nextMetrics.lastCenterX = faceCenterX;
              nextMetrics.lastCenterY = faceCenterY;
            }

            return {
              ...item,
              facialMetrics: nextMetrics,
            };
          }),
        );
      } catch {
        setAnswers((prev) =>
          prev.map((item, index) =>
            index === questionIndex
              ? {
                  ...item,
                  facialMetrics: {
                    ...(item.facialMetrics || {}),
                    supported: false,
                  },
                }
              : item,
          ),
        );
      }
    }, 1200);
  };

  const uploadClip = async (blob, questionIndex) => {
    if (!blob || !blob.size) {
      return "";
    }

    setUploadingClip(true);
    try {
      const res = await fetch("http://localhost:5000/api/interview/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "video/webm",
          "X-Question-Index": String(questionIndex),
          "X-File-Ext": "webm",
        },
        body: blob,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Clip upload failed");
      }

      return data.videoUrl || "";
    } catch {
      setError("Recording was captured, but upload failed.");
      return "";
    } finally {
      setUploadingClip(false);
    }
  };

  const startRecording = () => {
    if (!mediaStreamRef.current || recording) {
      return;
    }

    try {
      const questionIndex = activeQuestion;
      recordingChunksRef.current = [];
      const recorder = new MediaRecorder(mediaStreamRef.current);

      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const duration = Math.max(
          0,
          Math.round((Date.now() - recordingStartedAtRef.current) / 1000),
        );
        const blob = new Blob(recordingChunksRef.current, { type: "video/webm" });

        uploadClip(blob, questionIndex).then((videoUrl) => {
          setAnswers((prev) =>
            prev.map((item, index) =>
              index === questionIndex
                ? {
                    ...item,
                    usedCamera: true,
                    videoDurationSeconds: Math.max(item.videoDurationSeconds || 0, duration),
                    videoUrl: videoUrl || item.videoUrl || "",
                  }
                : item,
            ),
          );
        });
      };

      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();
      recorder.start();
      setRecording(true);
      startFaceTracking(questionIndex);
    } catch {
      setError("Recording could not start in this browser.");
    }
  };

  const stopRecording = () => {
    if (analysisIntervalRef.current) {
      window.clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const generateQuestions = async () => {
    try {
      setGenerating(true);
      setError("");
      setReport(null);
      const res = await axios.get("http://localhost:5000/api/interview/questions", {
        headers: { Authorization: `Bearer ${token}` },
        params: form,
      });

      const nextQuestions = res.data?.questions || [];
      setQuestions(nextQuestions);
      setActiveQuestion(0);
      setAnswers(
        nextQuestions.map(() => ({
          answer: "",
          responseSeconds: 0,
          usedCamera: false,
          videoDurationSeconds: 0,
          videoUrl: "",
          facialMetrics: {
            supported: false,
            totalSamples: 0,
            faceVisibleSamples: 0,
            centeredSamples: 0,
            stableSamples: 0,
            lastCenterX: 0,
            lastCenterY: 0,
          },
        })),
      );
    } catch {
      setError("Could not generate interview questions.");
    } finally {
      setGenerating(false);
    }
  };

  const updateAnswer = (index, nextValue) => {
    setAnswers((prev) =>
      prev.map((answer, answerIndex) =>
        answerIndex === index
          ? {
              ...answer,
              ...nextValue,
            }
          : answer,
      ),
    );
  };

  const saveCurrentTiming = () => {
    if (!questions.length) {
      return;
    }

    const elapsed = Math.min(
      QUESTION_TIMER_SECONDS,
      Math.max(0, Math.round((Date.now() - questionStartRef.current) / 1000)),
    );

    updateAnswer(activeQuestion, { responseSeconds: elapsed });
  };

  const goToQuestion = (index) => {
    stopRecording();
    saveCurrentTiming();
    setActiveQuestion(index);
  };

  const submitInterview = async () => {
    try {
      stopRecording();
      saveCurrentTiming();
      setSubmitting(true);
      setError("");
      const res = await axios.post(
        "http://localhost:5000/api/interview/sessions",
        {
          ...form,
          interviewMode: cameraReady ? "video" : "text",
          answers,
          videoSummary: {
            cameraEnabled: cameraReady,
            recordingsCount: answers.filter((item) => item.usedCamera).length,
            totalRecordedSeconds: answers.reduce(
              (sum, item) => sum + (item.videoDurationSeconds || 0),
              0,
            ),
          },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setReport(res.data);
      setHistory((prev) => [res.data, ...prev]);
    } catch {
      setError("Could not save interview feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const completion = useMemo(() => {
    if (!answers.length) return 0;
    const completed = answers.filter((item) => item.answer.trim()).length;
    return Math.round((completed / answers.length) * 100);
  }, [answers]);

  const currentAnswer = answers[activeQuestion] || {
    answer: "",
    responseSeconds: 0,
    usedCamera: false,
    videoDurationSeconds: 0,
    videoUrl: "",
    facialMetrics: {
      supported: false,
      totalSamples: 0,
      faceVisibleSamples: 0,
      centeredSamples: 0,
      stableSamples: 0,
    },
  };

  return (
    <StudentLayout
      title="Video mock interview practice with real camera workflow."
      subtitle="Set up your target role, turn on the camera, record your answers, and review both content and delivery feedback."
      actions={
        <div className="flex flex-wrap gap-3">
          <button
            onClick={startCamera}
            disabled={cameraReady || cameraLoading}
            className={`secondary-btn ${cameraReady || cameraLoading ? "opacity-70" : ""}`}
          >
            {cameraLoading ? "Opening Camera..." : cameraReady ? "Camera Ready" : "Enable Camera"}
          </button>
          <button onClick={generateQuestions} className="primary-btn">
            {generating ? "Generating..." : "Generate Questions"}
          </button>
        </div>
      }
    >
      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <section className="section-panel">
          <h2 className="text-2xl font-black text-slate-900">Interview Setup</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Field label="Company" value={form.company} onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))} />
            <Field label="Role" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} />
            <Field label="Focus Skill" value={form.skill} onChange={(e) => setForm((prev) => ({ ...prev, skill: e.target.value }))} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="overflow-hidden rounded-[28px] border border-slate-100 bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-sm text-slate-300">
                <span>{cameraReady ? "Live interview preview" : "Camera preview"}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${recording ? "bg-rose-500/20 text-rose-200" : "bg-emerald-500/20 text-emerald-200"}`}>
                  {recording ? "Recording" : cameraReady ? "Ready" : "Offline"}
                </span>
              </div>
              <div className="aspect-video bg-slate-950">
                {cameraReady ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-400">
                    Turn on the camera to practice with a real video-interview setup.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-teal-100 bg-teal-50/70 p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
                Interview Controls
              </div>
              <div className="mt-4 grid gap-3">
                <button
                  onClick={recording ? stopRecording : startRecording}
                  disabled={!cameraReady || uploadingClip}
                  className={`primary-btn ${!cameraReady ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {recording ? "Stop Recording" : "Record Current Answer"}
                </button>
                <button
                  onClick={stopCamera}
                  disabled={!cameraReady}
                  className={`secondary-btn ${!cameraReady ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  Stop Camera
                </button>
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <div>Question timer: {timeLeft}s</div>
                <div>Completion: {completion}%</div>
                <div>Mode: {cameraReady ? "Video interview" : "Text fallback"}</div>
                <div>Clip upload: {uploadingClip ? "Uploading..." : "Idle"}</div>
              </div>
            </div>
          </div>

          {questions.length ? (
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-black text-slate-900">Interview Round</h3>
                <span className="soft-badge">
                  Question {activeQuestion + 1} of {questions.length}
                </span>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                {questions.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToQuestion(index)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      index === activeQuestion
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {index + 1}. {item.topic}
                  </button>
                ))}
              </div>

              <div className="rounded-[24px] border border-slate-100 bg-white/80 p-5">
                <div className="text-sm uppercase tracking-[0.2em] text-teal-700">
                  {questions[activeQuestion]?.topic}
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  {questions[activeQuestion]?.question}
                </p>
                <textarea
                  rows={5}
                  className="field-input mt-4"
                  placeholder="Type a backup transcript or summary of your spoken answer here..."
                  value={currentAnswer.answer}
                  onChange={(e) =>
                    updateAnswer(activeQuestion, {
                      answer: e.target.value,
                    })
                  }
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MiniStat label="Response Time" value={`${currentAnswer.responseSeconds || 0}s`} />
                  <MiniStat
                    label="Video Recorded"
                    value={currentAnswer.usedCamera ? "Yes" : "No"}
                  />
                  <MiniStat
                    label="Clip Length"
                    value={`${currentAnswer.videoDurationSeconds || 0}s`}
                  />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MiniStat
                    label="Face Visible"
                    value={`${currentAnswer.facialMetrics?.faceVisibleSamples || 0}/${currentAnswer.facialMetrics?.totalSamples || 0}`}
                  />
                  <MiniStat
                    label="Centered"
                    value={String(currentAnswer.facialMetrics?.centeredSamples || 0)}
                  />
                  <MiniStat
                    label="Steady"
                    value={String(currentAnswer.facialMetrics?.stableSamples || 0)}
                  />
                </div>
                {currentAnswer.videoUrl ? (
                  <a
                    href={currentAnswer.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ghost-btn mt-4"
                  >
                    Open saved clip
                  </a>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => goToQuestion(Math.max(activeQuestion - 1, 0))}
                  disabled={activeQuestion === 0}
                  className={`secondary-btn ${activeQuestion === 0 ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => goToQuestion(Math.min(activeQuestion + 1, questions.length - 1))}
                  disabled={activeQuestion === questions.length - 1}
                  className={`secondary-btn ${activeQuestion === questions.length - 1 ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  Next
                </button>
                <button
                  onClick={submitInterview}
                  disabled={submitting || completion === 0}
                  className={`primary-btn ${submitting || completion === 0 ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {submitting ? "Evaluating..." : "Get Interview Feedback"}
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="mt-6 text-sm text-slate-500">Loading interview workspace...</div>
          ) : null}
        </section>

        <div className="space-y-6">
          <section className="section-panel">
            <h2 className="text-2xl font-black text-slate-900">Latest Feedback</h2>
            {!report ? (
              <p className="mt-4 text-sm text-slate-500">
                Complete an interview round to see your content score, delivery score, and improvement tips.
              </p>
            ) : (
              <>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <ScoreCard label="Overall" value={`${report.overallScore}%`} tone="teal" />
                  <ScoreCard label="Content" value={`${report.contentScore || 0}%`} tone="sky" />
                  <ScoreCard label="Delivery" value={`${report.deliveryScore || 0}%`} tone="amber" />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <ScoreCard label="Confidence" value={`${report.confidenceScore || 0}%`} tone="emerald" />
                  <ScoreCard label="Confusion" value={`${report.confusionScore || 0}%`} tone="rose" />
                  <ScoreCard label="Face Tracking" value={report.facialInsights?.faceTrackingSupported ? "On" : "Limited"} tone="slate" />
                </div>
                <div className="mt-4 rounded-[24px] border border-slate-100 bg-white/80 px-5 py-4 text-sm leading-7 text-slate-600">
                  {report.expressionSummary || report.facialInsights?.summary}
                </div>
                <FeedbackList title="Strengths" items={report.strengths} tone="green" />
                <FeedbackList title="Improve Next" items={report.improvements} tone="orange" />
                <FeedbackList title="Tips" items={report.tips} tone="blue" />
              </>
            )}
          </section>

          <section className="section-panel">
            <h2 className="text-2xl font-black text-slate-900">Interview History</h2>
            <div className="mt-5 space-y-3">
              {history.length ? (
                history.slice(0, 5).map((item) => (
                  <div
                    key={item._id}
                    className="rounded-[22px] border border-slate-100 bg-white/80 px-4 py-3"
                  >
                    <div className="font-semibold text-slate-900">
                      {item.company || "General"} / {item.role || "Interview"}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Skill: {item.skill || "General"} / Mode: {item.interviewMode || "text"}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Overall: {item.overallScore}% / Confidence: {item.confidenceScore || 0}%
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No interview sessions yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </StudentLayout>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input {...props} className="field-input" />
    </div>
  );
}

function FeedbackList({ title, items = [], tone }) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    blue: "border-sky-200 bg-sky-50 text-sky-700",
  };
  const useCards = title === "Tips";

  return (
    <div className="mt-5">
      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </div>
      {useCards ? (
        <div className="mt-3 space-y-3">
          {(items.length ? items : ["No items yet"]).map((item) => (
            <div
              key={`${title}-${item}`}
              className={`rounded-[22px] border px-4 py-3 text-sm leading-7 ${tones[tone]}`}
            >
              {item}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {(items.length ? items : ["No items yet"]).map((item) => (
            <span
              key={`${title}-${item}`}
              className={`max-w-full break-words rounded-full border px-3 py-1 text-sm font-medium ${tones[tone]}`}
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}

function ScoreCard({ label, value, tone }) {
  const toneClasses = {
    teal: "border-teal-100 bg-teal-50/70 text-teal-700",
    sky: "border-sky-100 bg-sky-50/70 text-sky-700",
    amber: "border-amber-100 bg-amber-50/70 text-amber-700",
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
    rose: "border-rose-100 bg-rose-50/70 text-rose-700",
    slate: "border-slate-100 bg-slate-50/70 text-slate-700",
  };

  return (
    <div className={`rounded-[24px] border px-5 py-5 ${toneClasses[tone]}`}>
      <div className="text-sm">{label}</div>
      <div className="mt-2 text-4xl font-black text-slate-900">{value}</div>
    </div>
  );
}

