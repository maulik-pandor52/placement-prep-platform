import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-[#f5f1e8] px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] bg-[#163a2f] p-10 text-white shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-200">
            Admin Signup
          </p>
          <h1 className="mt-5 text-5xl font-black leading-tight">
            Create a protected admin account for the management team.
          </h1>
          <p className="mt-5 text-lg text-emerald-100/90">
            This page works only for admin-approved emails. If the email is not in
            `ADMIN_EMAILS`, signup will be blocked.
          </p>

          <div className="mt-10 rounded-3xl bg-white/10 p-5">
            <div className="text-sm uppercase tracking-[0.28em] text-emerald-200">
              What you get
            </div>
            <ul className="mt-4 space-y-3 text-sm text-emerald-50">
              <li>Full CRUD for questions</li>
              <li>Dedicated skill catalog management</li>
              <li>Company profile and focus-skill management</li>
            </ul>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-slate-900">Create Admin Account</h2>
          <p className="mt-2 text-sm text-slate-500">
            Use the same email that is whitelisted on the backend.
          </p>

          {error ? (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                loading ? "cursor-wait bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {loading ? "Creating account..." : "Create Admin Account"}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <p>
              Already have admin access?{" "}
              <Link to="/admin/login" className="font-semibold text-emerald-700 hover:underline">
                Sign in
              </Link>
            </p>
            <p>
              Student registration:{" "}
              <Link to="/register" className="font-semibold text-slate-900 hover:underline">
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
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input
        {...props}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        required
      />
    </div>
  );
}
