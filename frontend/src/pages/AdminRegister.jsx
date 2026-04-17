import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PrepEasyLogo from "../components/PrepEasyLogo";
import { authService } from "../services/authService";

export default function AdminRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", inviteCode: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "PrepEasy Admin | Create Account";
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await authService.adminRegister({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        inviteCode: form.inviteCode,
      });

      setSuccess(res.data.message || "Admin account created.");
      setTimeout(() => {
        navigate("/admin/login", { replace: true });
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Admin signup failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-wrap lg:grid-cols-[1.02fr_0.98fr]">
        <section className="auth-feature-panel">
          <PrepEasyLogo
            subtitle="Set up protected access for the admin team with a cleaner onboarding surface."
            textClassName="text-white"
            subtextClassName="text-slate-100/80"
          />
          <div className="mt-6 admin-badge">Admin Signup</div>
          <h1 className="mt-5 text-5xl font-black leading-tight text-white">
            Create a secure admin account for the people who manage PrepEasy.
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-100/82">
            New admins can register here with the shared invite code, then sign in normally to maintain questions, skills, companies, and platform activity.
          </p>

          <div className="mt-8 space-y-4">
            <div className="auth-mini-card">
              <div className="text-lg font-semibold text-white">Question operations</div>
              <p className="mt-2 text-sm leading-7 text-slate-100/80">Manage assessment content from a dedicated admin workflow.</p>
            </div>
            <div className="auth-mini-card">
              <div className="text-lg font-semibold text-white">Skill and company governance</div>
              <p className="mt-2 text-sm leading-7 text-slate-100/80">Keep matching logic and platform readiness data consistent.</p>
            </div>
            <div className="auth-mini-card">
              <div className="text-lg font-semibold text-white">Scalable access control</div>
              <p className="mt-2 text-sm leading-7 text-slate-100/80">Create trusted admin accounts without exposing student auth routes.</p>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="admin-badge">Protected Admin Setup</div>
          <h2 className="mt-5 text-3xl font-black text-white">Create admin account</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Enter the new admin’s details and the valid invite code to save the account securely in the database.
          </p>

          {error ? (
            <div className="mt-6 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Admin Name"
            />
            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@example.com"
            />
            <Field
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
            />
            <Field
              label="Admin Invite Code"
              name="inviteCode"
              type="password"
              value={form.inviteCode}
              onChange={handleChange}
              placeholder="Enter admin invite code"
            />

            <button
              type="submit"
              disabled={loading}
              className={`admin-btn w-full ${loading ? "cursor-wait opacity-70" : ""}`}
            >
              {loading ? "Creating account..." : "Create Admin Account"}
            </button>
          </form>

          <div className="mt-8 fade-divider" />

          <div className="mt-6 space-y-3 text-sm text-slate-400">
            <p>
              Already have admin access?{" "}
              <Link to="/admin/login" className="font-semibold text-cyan-300 hover:underline">
                Sign in
              </Link>
            </p>
            <p>
              Student registration:{" "}
              <Link to="/register" className="font-semibold text-slate-100 hover:underline">
                Go to student signup
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
