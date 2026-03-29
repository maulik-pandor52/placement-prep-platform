import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import PrepEasyLogo from "../components/PrepEasyLogo";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "PrepEasy Admin | Sign In";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/auth/admin/login", {
        email: email.trim(),
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Admin login failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-canvas px-4 py-10 text-slate-100">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="admin-panel p-10">
          <PrepEasyLogo
            subtitle="Admin control for content, companies, and readiness data."
            textClassName="text-white"
            subtextClassName="text-slate-300"
          />
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
            Admin Access
          </p>
          <h1 className="mt-5 text-5xl font-black leading-tight">
            Control the platform from a dedicated admin space.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">
            Sign in with an admin-approved email to manage the full question bank,
            skills, companies, and platform activity.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <FeatureCard title="Questions" text="Create, update, and remove quiz content." />
            <FeatureCard title="Skills" text="Maintain the skill catalog used across reports." />
            <FeatureCard title="Companies" text="Manage company profiles and focus areas." />
          </div>
        </section>

        <section className="admin-card p-8 text-slate-100">
          <PrepEasyLogo subtitle="Admin sign in for PrepEasy" compact />
          <h2 className="mt-4 text-3xl font-bold text-white">Admin Sign In</h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in with an existing admin account created through invite code or admin access.
          </p>

          {error ? (
            <div className="mt-6 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field
              label="Admin Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />

            <button
              type="submit"
              disabled={loading}
              className={`admin-btn w-full ${
                loading ? "cursor-wait opacity-70" : ""
              }`}
            >
              {loading ? "Signing in..." : "Sign In to Admin"}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-sm text-slate-400">
            <p>
              Need an admin account?{" "}
              <Link to="/admin/register" className="font-semibold text-cyan-300 hover:underline">
                Create admin account
              </Link>
            </p>
            <p>
              Student login:{" "}
              <Link to="/login" className="font-semibold text-slate-100 hover:underline">
                Go to student sign in
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
      <label className="mb-2 block text-sm font-medium text-slate-200">{label}</label>
      <input {...props} className="admin-field" required />
    </div>
  );
}

function FeatureCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-lg font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm text-slate-300">{text}</p>
    </div>
  );
}
