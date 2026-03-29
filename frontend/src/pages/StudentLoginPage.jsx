import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import PrepEasyLogo from "../components/PrepEasyLogo";

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
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 8000,
        },
      );

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
    <div className="app-canvas">
      <div className="page-wrap">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="hero-panel px-8 py-10 sm:px-10 sm:py-12">
            <PrepEasyLogo
              subtitle="Smart placement preparation with one calm, focused workspace."
              textClassName="text-white"
              subtextClassName="text-slate-100/80"
            />
            <div className="soft-badge">Student Login</div>
            <h1 className="mt-5 text-5xl font-black leading-tight">
              Prepare with a platform that feels focused, modern, and easy to use.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-100/85">
              Track quiz growth, view your report, practice company-specific tests,
              and build confidence with mock interviews in one clean workspace.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <FeatureCard title="Smart Reports" text="See strengths, weaknesses, and next steps." />
              <FeatureCard title="Company Prep" text="Take targeted tests based on suggested companies." />
              <FeatureCard title="Progress Flow" text="Keep all your attempts and rewards in one place." />
            </div>
          </section>

          <section className="section-panel p-8 sm:p-10">
            <PrepEasyLogo
              subtitle="Sign in to continue your preparation."
              compact
            />
            <div className="soft-badge">Welcome Back</div>
            <h2 className="mt-4 text-3xl font-black text-slate-100">Sign in to continue</h2>
            <p className="mt-2 text-sm text-slate-400">
              Use your student account to open your dashboard and resume practice.
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
                className={`primary-btn w-full ${
                  loading ? "cursor-wait opacity-70" : ""
                }`}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

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
                  Go to admin sign in
                </Link>
              </p>
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

function FeatureCard({ title, text }) {
  return (
    <div className="rounded-[24px] border border-white/12 bg-white/8 p-4">
      <div className="text-lg font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm text-slate-100/80">{text}</p>
    </div>
  );
}
