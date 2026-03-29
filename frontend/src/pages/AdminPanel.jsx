import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const emptyQuestion = {
  question: "",
  options: ["", "", "", ""],
  answer: 0,
  skill: "",
  category: "",
  company: "",
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    stats: { userCount: 0, questionCount: 0, resultCount: 0 },
    users: [],
    results: [],
    questions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyQuestion);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!token || user?.role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get("http://localhost:5000/api/admin/overview", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (err) {
        console.error("Failed to load admin overview:", err);
        setError(
          err.response?.data?.message ||
            "Could not load admin dashboard. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [navigate, token, user?.role]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const handleOptionChange = (index, value) => {
    setForm((prev) => {
      const nextOptions = [...prev.options];
      nextOptions[index] = value;
      return { ...prev, options: nextOptions };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        answer: Number(form.answer),
        options: form.options.map((item) => item.trim()).filter(Boolean),
      };

      const res = await axios.post(
        "http://localhost:5000/api/admin/questions",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setData((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          questionCount: prev.stats.questionCount + 1,
        },
        questions: [res.data, ...prev.questions].slice(0, 20),
      }));
      setForm(emptyQuestion);
    } catch (err) {
      console.error("Failed to create question:", err);
      setError(
        err.response?.data?.message || "Could not create the question.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-lg font-medium text-gray-600">
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage users, questions, and platform activity
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/dashboard"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Student View
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AdminStat title="Users" value={data.stats.userCount} />
          <AdminStat title="Questions" value={data.stats.questionCount} />
          <AdminStat title="Quiz Results" value={data.stats.resultCount} />
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_1fr]">
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800">
              Add New Question
            </h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Question
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                  rows={3}
                  value={form.question}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, question: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {form.options.map((option, index) => (
                  <div key={index}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Option {index + 1}
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      required={index < 2}
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field
                  label="Correct Option"
                  value={form.answer}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, answer: e.target.value }))
                  }
                  type="number"
                  min="0"
                  max={Math.max(form.options.filter(Boolean).length - 1, 0)}
                />
                <Field
                  label="Skill"
                  value={form.skill}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, skill: e.target.value }))
                  }
                />
                <Field
                  label="Category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                />
                <Field
                  label="Company"
                  value={form.company}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, company: e.target.value }))
                  }
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`rounded-lg px-5 py-3 text-sm font-medium text-white transition ${
                  saving
                    ? "cursor-wait bg-blue-400"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {saving ? "Saving Question..." : "Save Question"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800">Recent Users</h2>
            <div className="mt-4 space-y-3">
              {data.users.map((item) => (
                <div
                  key={item._id}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div className="font-medium text-gray-800">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.email}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-blue-600">
                    {item.role}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <PanelCard title="Recent Results">
            {data.results.map((item) => (
              <div
                key={item._id}
                className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div className="font-medium text-gray-800">
                  {item.userId?.name || "Unknown user"}
                </div>
                <div className="text-sm text-gray-500">
                  {item.userId?.email || "No email"}
                </div>
                <div className="mt-1 text-sm text-blue-700">
                  {item.score}/{item.total} •{" "}
                  {item.testType === "company" && item.company
                    ? `${item.company} test`
                    : "Initial test"}
                </div>
              </div>
            ))}
          </PanelCard>

          <PanelCard title="Latest Questions">
            {data.questions.map((item) => (
              <div
                key={item._id}
                className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div className="font-medium text-gray-800">{item.question}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Tag label={`Skill: ${item.skill}`} />
                  <Tag label={`Category: ${item.category}`} />
                  {item.company ? <Tag label={`Company: ${item.company}`} /> : null}
                </div>
              </div>
            ))}
          </PanelCard>
        </div>
      </main>
    </div>
  );
}

function AdminStat({ title, value }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <div className="text-sm font-medium uppercase tracking-wide text-gray-500">
        {title}
      </div>
      <div className="mt-3 text-4xl font-bold text-gray-800">{value}</div>
    </div>
  );
}

function PanelCard({ title, children }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-md">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}

function Tag({ label }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 font-medium text-gray-600">
      {label}
    </span>
  );
}
