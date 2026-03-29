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

  useEffect(() => {
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

    fetchOverview();
  }, []);

  return (
    <AdminLayout
      title="Overview"
      subtitle="Monitor platform activity and jump into each admin management area."
    >
      {error ? <Notice tone="error">{error}</Notice> : null}

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

      {loading ? (
        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-slate-600">Loading admin overview...</p>
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
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
        {title}
      </div>
      <div className="mt-3 text-4xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function ActionCard({ title, text, to, cta }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm text-slate-600">{text}</p>
      <Link
        to={to}
        className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        {cta}
      </Link>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function ListRow({ title, subtitle, meta }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="font-medium text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
        {meta}
      </div>
    </div>
  );
}

function Notice({ children, tone }) {
  const styles =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
