import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import AdminLayout from "../components/AdminLayout";

export default function AdminDashboard() {
  const [data, setData] = useState({
    stats: {
      userCount: 0,
      questionCount: 0,
      resultCount: 0,
      skillCount: 0,
      companyCount: 0,
    },
    users: [],
    results: [],
    skills: [],
    companies: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });
  const [adminCreateState, setAdminCreateState] = useState({
    loading: false,
    error: "",
    success: "",
  });

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/admin/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not load admin overview.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdminInput = (e) => {
    const { name, value } = e.target;
    setAdminForm((prev) => ({ ...prev, [name]: value }));
    setAdminCreateState((prev) => ({ ...prev, error: "", success: "" }));
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    try {
      setAdminCreateState({ loading: true, error: "", success: "" });
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:5000/api/admin/admin-users",
        {
          name: adminForm.name.trim(),
          email: adminForm.email.trim(),
          password: adminForm.password,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        },
      );

      setAdminCreateState({
        loading: false,
        error: "",
        success: res.data.message || "Admin account created successfully.",
      });
      setAdminForm({ name: "", email: "", password: "" });
      fetchOverview();
    } catch (err) {
      setAdminCreateState({
        loading: false,
        success: "",
        error:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not create admin account.",
      });
    }
  };

  return (
    <AdminLayout
      title="Overview"
      subtitle="Monitor platform activity and jump into each admin management area."
    >
      {error ? <Notice tone="error">{error}</Notice> : null}

      <section className="admin-panel overflow-hidden p-6 sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="admin-badge">Operations Console</div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Keep the PrepEasy engine clean, current, and ready.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Review platform activity, maintain the question bank, create trusted admin
              access, and keep skills and company data aligned with placement goals.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <HighlightMetric label="Admin Users" value={String(data.users.filter((item) => item.role === "admin").length)} />
            <HighlightMetric label="Recent Results" value={String(data.results.length)} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Users" value={data.stats.userCount} />
        <StatCard title="Questions" value={data.stats.questionCount} />
        <StatCard title="Results" value={data.stats.resultCount} />
        <StatCard title="Skills" value={data.stats.skillCount} />
        <StatCard title="Companies" value={data.stats.companyCount} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <ActionCard
          title="Question Bank"
          text="Create, update, and remove quiz content from one place."
          to="/admin/questions"
          cta="Manage Questions"
        />
        <ActionCard
          title="Skill Catalog"
          text="Maintain the skills used in quizzes, reports, and interviews."
          to="/admin/skills"
          cta="Manage Skills"
        />
        <ActionCard
          title="Company Profiles"
          text="Manage target companies and the focus areas for company-specific tests."
          to="/admin/companies"
          cta="Manage Companies"
        />
      </div>

      <div className="mt-8">
        <section className="admin-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Create Another Admin</h3>
              <p className="mt-2 text-sm text-slate-300">
                Use this admin-only form to create new admin accounts directly in the database.
              </p>
            </div>
            <div className="admin-badge">
              Admin only
            </div>
          </div>

          {adminCreateState.error ? <Notice tone="error">{adminCreateState.error}</Notice> : null}
          {adminCreateState.success ? <Notice tone="success">{adminCreateState.success}</Notice> : null}

          <form onSubmit={handleCreateAdmin} className="mt-6 grid gap-4 md:grid-cols-3">
            <Field
              label="Full Name"
              name="name"
              value={adminForm.name}
              onChange={handleAdminInput}
              placeholder="Admin Name"
            />
            <Field
              label="Email"
              name="email"
              type="email"
              value={adminForm.email}
              onChange={handleAdminInput}
              placeholder="newadmin@example.com"
            />
            <Field
              label="Password"
              name="password"
              type="password"
              value={adminForm.password}
              onChange={handleAdminInput}
              placeholder="Minimum 6 characters"
            />
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={adminCreateState.loading}
                className="admin-btn disabled:cursor-wait disabled:opacity-70"
              >
                {adminCreateState.loading ? "Creating admin..." : "Create Admin Account"}
              </button>
            </div>
          </form>
        </section>
      </div>

      {loading ? (
        <div className="admin-card mt-8 p-8">
          <p className="text-slate-300">Loading admin overview...</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <Panel title="Recent Users">
            {data.users.map((item) => (
              <ListRow
                key={item._id}
                title={item.name}
                subtitle={item.email}
                meta={item.role}
              />
            ))}
          </Panel>

          <Panel title="Recent Results">
            {data.results.map((item) => (
              <ListRow
                key={item._id}
                title={item.userId?.name || "Unknown user"}
                subtitle={`${item.score}/${item.total}`}
                meta={item.company ? `${item.company} test` : "Initial test"}
              />
            ))}
          </Panel>

          <Panel title="Latest Skills">
            {data.skills.map((item) => (
              <ListRow
                key={item._id}
                title={item.name}
                subtitle={item.description || "No description"}
                meta={item.category}
              />
            ))}
          </Panel>

          <Panel title="Latest Companies">
            {data.companies.map((item) => (
              <ListRow
                key={item._id}
                title={item.name}
                subtitle={item.description || "No description"}
                meta={`${item.focusSkills?.length || 0} skills`}
              />
            ))}
          </Panel>
        </div>
      )}
    </AdminLayout>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="admin-card p-6">
      <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
        {title}
      </div>
      <div className="mt-3 text-4xl font-bold text-white">{value}</div>
    </div>
  );
}

function ActionCard({ title, text, to, cta }) {
  return (
    <div className="admin-card p-6">
      <div className="admin-badge">Manage</div>
      <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm text-slate-300">{text}</p>
      <Link
        to={to}
        className="admin-btn mt-6"
      >
        {cta}
      </Link>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="admin-card p-6">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function ListRow({ title, subtitle, meta }) {
  return (
    <div className="admin-card-muted px-4 py-3">
      <div className="font-medium text-white">{title}</div>
      <div className="mt-1 text-sm text-slate-400">{subtitle}</div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
        {meta}
      </div>
    </div>
  );
}

function Notice({ children, tone }) {
  const styles =
    tone === "error"
      ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
      : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";

  return (
    <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      <input
        {...props}
        className="admin-field"
        required
      />
    </label>
  );
}

function HighlightMetric({ label, value }) {
  return (
    <div className="admin-card-muted px-5 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
        {label}
      </div>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
    </div>
  );
}
