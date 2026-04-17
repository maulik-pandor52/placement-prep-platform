import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PrepEasyLogo from "../components/PrepEasyLogo";
import { authService } from "../services/authService";

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
      await authService.studentRegister({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

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
    <div className="auth-shell">
      <div className="auth-wrap lg:grid-cols-[1.04fr_0.96fr]">
        <section className="auth-form-panel">
          <div className="soft-badge">Create Account</div>
          <h1 className="mt-5 text-3xl font-black text-slate-50">
            Build your PrepEasy student workspace
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Create your student account to start quizzes, unlock reports, track activity streaks, and prepare for company-specific rounds.
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
                className={`primary-btn w-full ${loading ? "cursor-wait opacity-70" : ""}`}
              >
                {loading ? "Creating account..." : "Create Student Account"}
              </button>
            </form>

          <div className="mt-8 fade-divider" />

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

        <section className="auth-feature-panel">
          <PrepEasyLogo
            subtitle="A cleaner frontend for placement practice, tracking, and interview preparation."
            textClassName="text-white"
            subtextClassName="text-slate-100/80"
          />
          <div className="mt-6 soft-badge">Why Students Stay</div>
          <h2 className="mt-5 text-5xl font-black leading-tight text-white">
            One modern workspace for practice, insight, and company readiness.
          </h2>
          <div className="mt-8 space-y-4">
            <InsightCard
              title="Reports that guide action"
              text="Understand what improved, what dropped, and what to focus on next without guessing."
            />
            <InsightCard
              title="Company-focused movement"
              text="Shift from general preparation into targeted tests with a clearer next-step path."
            />
            <InsightCard
              title="Progress that feels visible"
              text="Keep badges, streaks, attempts, and readiness snapshots in one consistent product flow."
            />
          </div>
        </section>
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
    <div className="auth-mini-card">
      <div className="text-lg font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-7 text-slate-100/80">{text}</p>
    </div>
  );
}
