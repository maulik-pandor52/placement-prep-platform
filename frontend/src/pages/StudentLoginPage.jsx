import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PrepEasyLogo from "../components/PrepEasyLogo";
import { authService } from "../services/authService";

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "PrepEasy | Sign In";
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authService.studentLogin({ email, password });

      const { token, user } = res.data;

      if (!token) {
        throw new Error("No token received from server");
      }

      if (user?.role === "admin") {
        throw new Error("Invalid email or password");
      }

      localStorage.setItem("token", token);
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Login failed. Please check your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-wrap">
        <section className="auth-feature-panel">
          <PrepEasyLogo
            subtitle="Modern placement preparation with focused analytics, company readiness, and interview practice."
            textClassName="text-white"
            subtextClassName="text-slate-100/80"
          />
          <div className="mt-6 soft-badge">Student Sign In</div>
          <h1 className="mt-5 text-5xl font-black leading-tight text-white">
            A cleaner frontend for smarter practice and faster decisions.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-100/82">
            PrepEasy keeps your quiz performance, company opportunities, activity streaks, and interview readiness inside one polished workspace.
          </p>

          <div className="auth-feature-grid">
            <FeatureCard title="Readable Insights" text="Understand score trends and weak areas without dashboard clutter." />
            <FeatureCard title="Company Readiness" text="See fit, benchmark gaps, and suggested next tests clearly." />
            <FeatureCard title="Momentum Tracking" text="Keep streaks, badges, and practice history visible in one flow." />
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="soft-badge">Welcome Back</div>
          <h2 className="mt-5 text-3xl font-black text-slate-50">Sign in to your student workspace</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Enter your student account details to reopen your dashboard, latest analytics, and profile progress.
          </p>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={loading}
              className={`primary-btn w-full ${loading ? "cursor-wait opacity-70" : ""}`}
            >
              {loading ? "Signing in..." : "Enter Workspace"}
            </button>
          </form>

          <div className="mt-8 fade-divider" />

          <div className="mt-6 space-y-3 text-sm text-slate-400">
            <p>
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-semibold text-cyan-300 hover:underline">
                Create one now
              </Link>
            </p>
            <p>
              Admin access?{" "}
              <Link to="/admin/login" className="font-semibold text-slate-100 hover:underline">
                Open admin sign in
              </Link>
            </p>
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

function FeatureCard({ title, text }) {
  return (
    <div className="auth-mini-card">
      <div className="text-lg font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm text-slate-100/80">{text}</p>
    </div>
  );
}
