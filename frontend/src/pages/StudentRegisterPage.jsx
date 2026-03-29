import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import PrepEasyLogo from "../components/PrepEasyLogo";

export default function StudentRegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = "PrepEasy | Create Account";
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 8000,
        },
      );

      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-canvas">
      <div className="page-wrap">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <section className="section-panel p-8 sm:p-10">
            <PrepEasyLogo
              subtitle="Create your account and start building momentum."
              compact
            />
            <div className="soft-badge">Create Account</div>
            <h1 className="mt-4 text-3xl font-black text-slate-100">
              Start your placement preparation in a workspace built for momentum.
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Create your student account to take quizzes, receive performance
              reports, unlock rewards, and prepare for company-specific tests.
            </p>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleRegister} className="mt-8 space-y-5">
              <Field
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                autoComplete="name"
              />
              <Field
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="field-input pr-20"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-4 text-sm font-semibold text-slate-400 hover:text-slate-100"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`primary-btn w-full ${
                  loading ? "cursor-wait opacity-70" : ""
                }`}
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-sm text-slate-400">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-cyan-300 hover:underline">
                  Sign in
                </Link>
              </p>
              <p>
                Admin onboarding?{" "}
                <Link to="/admin/register" className="font-semibold text-slate-100 hover:underline">
                  Open admin signup
                </Link>
              </p>
            </div>
          </section>

          <section className="hero-panel px-8 py-10 sm:px-10 sm:py-12">
            <PrepEasyLogo
              subtitle="Placement practice that feels organized, motivating, and clear."
              textClassName="text-white"
              subtextClassName="text-slate-100/80"
            />
            <div className="soft-badge">Why Students Like It</div>
            <h2 className="mt-5 text-5xl font-black leading-tight">
              One platform for practice, tracking, and interview preparation.
            </h2>
            <div className="mt-8 space-y-4">
              <InsightCard
                title="Reports that make sense"
                text="Understand where you are strong, where you need work, and what to practice next."
              />
              <InsightCard
                title="Target company tests"
                text="Move from general preparation into company-focused practice with less confusion."
              />
              <InsightCard
                title="Progress that feels motivating"
                text="Use points, badges, and history to stay consistent instead of starting over every time."
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">{label}</label>
      <input {...props} className="field-input" required />
    </div>
  );
}

function InsightCard({ title, text }) {
  return (
    <div className="rounded-[24px] border border-white/12 bg-white/8 p-5">
      <div className="text-lg font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-7 text-slate-100/80">{text}</p>
    </div>
  );
}
