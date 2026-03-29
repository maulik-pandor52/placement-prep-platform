import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import PrepEasyLogo from "../components/PrepEasyLogo";

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
      const res = await axios.post(
        "http://localhost:5000/api/auth/admin/register",
        {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          inviteCode: form.inviteCode,
        },
      );

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
    <div className="admin-canvas px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="admin-panel p-10 text-white">
          <PrepEasyLogo
            subtitle="Set up protected admin access for PrepEasy."
            textClassName="text-white"
            subtextClassName="text-slate-300"
          />
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">
            Admin Signup
          </p>
          <h1 className="mt-5 text-5xl font-black leading-tight">
            Create a protected admin account for the management team.
          </h1>
          <p className="mt-5 text-lg text-slate-300">
            New admins can register here with the shared admin invite code. Once
            created, the account is stored in MongoDB and can sign in normally.
          </p>

          <div className="mt-10 admin-card-muted p-5">
            <div className="text-sm uppercase tracking-[0.28em] text-cyan-300">
              What you get
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li>Full CRUD for questions</li>
              <li>Dedicated skill catalog management</li>
              <li>Company profile and focus-skill management</li>
            </ul>
          </div>
        </section>

        <section className="admin-card p-8">
          <PrepEasyLogo subtitle="Create an admin account" compact />
          <h2 className="mt-4 text-3xl font-bold text-white">Create Admin Account</h2>
          <p className="mt-2 text-sm text-slate-400">
            Enter your admin details and the valid invite code.
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
              className={`admin-btn w-full ${
                loading ? "cursor-wait opacity-70" : ""
              }`}
            >
              {loading ? "Creating account..." : "Create Admin Account"}
            </button>
          </form>

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
