import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PrepEasyLogo from "../components/PrepEasyLogo";
import { authService } from "../services/authService";

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
      const res = await authService.adminLogin({
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
    <div className="auth-shell">
      <div className="auth-wrap">
        <section className="auth-feature-panel">
          <PrepEasyLogo
            subtitle="Protected access to content operations, analytics oversight, and platform governance."
            textClassName="text-white"
            subtextClassName="text-slate-100/80"
          />
          <div className="mt-6 admin-badge">Admin Access</div>
          <h1 className="mt-5 text-5xl font-black leading-tight text-white">
            A cleaner control center for managing the entire PrepEasy platform.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-100/82">
            Sign in with a trusted admin account to manage quiz content, skills, companies, and platform-wide engagement without crowding operations into one messy screen.
          </p>

          <div className="auth-feature-grid">
            <FeatureCard title="Question Bank" text="Create and maintain structured assessment content." />
            <FeatureCard title="Skill Catalog" text="Keep skills aligned with reports, analytics, and company matching." />
            <FeatureCard title="Company Profiles" text="Track demand, focus skills, and readiness targets in one place." />
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="admin-badge">Admin Sign In</div>
          <h2 className="mt-5 text-3xl font-black text-white">Open the admin workspace</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Use an existing admin account created through invite-code signup or internal admin access.
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
              className={`admin-btn w-full ${loading ? "cursor-wait opacity-70" : ""}`}
            >
              {loading ? "Signing in..." : "Enter Admin Workspace"}
            </button>
          </form>

          <div className="mt-8 fade-divider" />

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
    <div className="auth-mini-card">
      <div className="text-lg font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm text-slate-300">{text}</p>
    </div>
  );
}
