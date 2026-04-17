import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  ActionLinkCard,
  MetricGrid,
  MetricStatCard,
  ScrollListPanel,
} from "../components/dashboard/DashboardBlocks";
import {
  ActivityCalendarCard,
  AnalyticsMetricGrid,
  BadgeStrip,
} from "../components/dashboard/AnalyticsModules";
import { adminService } from "../services/adminService";

export default function AdminDashboard() {
  const [data, setData] = useState({
    stats: {
      userCount: 0,
      questionCount: 0,
      resultCount: 0,
      skillCount: 0,
      companyCount: 0,
      interviewCount: 0,
    },
    analytics: {
      averageQuizScore: 0,
      averageInterviewScore: 0,
      combinedAverage: 0,
      jobReadyStudents: 0,
      engagementLeaders: [],
    },
    users: [],
    results: [],
    interviews: [],
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

  const safeStats = {
    userCount: 0,
    questionCount: 0,
    resultCount: 0,
    skillCount: 0,
    companyCount: 0,
    interviewCount: 0,
    ...(data.stats || {}),
  };

  const safeAnalytics = {
    averageQuizScore: 0,
    averageInterviewScore: 0,
    combinedAverage: 0,
    jobReadyStudents: 0,
    engagementLeaders: [],
    ...(data.analytics || {}),
  };

  const safeUsers = Array.isArray(data.users) ? data.users : [];
  const safeResults = Array.isArray(data.results) ? data.results : [];
  const safeInterviews = Array.isArray(data.interviews) ? data.interviews : [];
  const safeSkills = Array.isArray(data.skills) ? data.skills : [];
  const safeCompanies = Array.isArray(data.companies) ? data.companies : [];

  const fetchOverview = async () => {
    try {
      const res = await adminService.getOverview();
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
      const res = await adminService.createAdminUser({
        name: adminForm.name.trim(),
        email: adminForm.email.trim(),
        password: adminForm.password,
      });

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
            <HighlightMetric
              label="Admin Users"
              value={String(safeUsers.filter((item) => item.role === "admin").length)}
            />
            <HighlightMetric label="Recent Results" value={String(safeResults.length)} />
          </div>
        </div>
      </section>

      <MetricGrid className="mt-6">
        <MetricStatCard title="Users" value={safeStats.userCount} meta="Registered accounts" />
        <MetricStatCard title="Questions" value={safeStats.questionCount} meta="Question bank size" tone="cyan" />
        <MetricStatCard title="Results" value={safeStats.resultCount} meta="Saved performance records" />
        <MetricStatCard title="Interviews" value={safeStats.interviewCount} meta="Mock interview sessions" tone="cyan" />
        <MetricStatCard title="Skills" value={safeStats.skillCount} meta="Tracked skill entries" tone="violet" />
        <MetricStatCard title="Companies" value={safeStats.companyCount} meta="Target company profiles" tone="emerald" />
      </MetricGrid>

      <div className="dashboard-split mt-8">
        <div className="dashboard-stack">
          <section className="section-panel admin-card">
            <div className="admin-badge">Result Analytics</div>
            <h3 className="mt-4 text-2xl font-semibold text-white">Quiz and interview performance snapshot</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Track weighted results, readiness quality, and student engagement without opening every
              record one by one.
            </p>

            <div className="mt-6">
              <AnalyticsMetricGrid
                items={[
                  {
                    title: "Avg Quiz Score",
                    value: `${safeAnalytics.averageQuizScore || 0}%`,
                    meta: "Across all quiz results",
                    tone: "cyan",
                  },
                  {
                    title: "Avg Interview Score",
                    value: `${safeAnalytics.averageInterviewScore || 0}%`,
                    meta: "Across mock interview sessions",
                    tone: "violet",
                  },
                  {
                    title: "Combined Average",
                    value: `${safeAnalytics.combinedAverage || 0}%`,
                    meta: "Weighted platform-wide readiness",
                    tone: "emerald",
                  },
                  {
                    title: "Job Ready Students",
                    value: safeAnalytics.jobReadyStudents || 0,
                    meta: "Latest readiness at 90% or above",
                  },
                ]}
              />
            </div>
          </section>

          <section className="section-panel admin-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <div className="admin-badge">Management Shortcuts</div>
                <h3 className="mt-4 text-2xl font-semibold text-white">Jump into the right admin area quickly.</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Keep the overview focused by moving editing workflows into dedicated spaces for
                  questions, skills, and company profiles.
                </p>
              </div>
            </div>
            <div className="dashboard-metric-grid mt-6">
              <ActionLinkCard
                title="Question Bank"
                text="Create, update, and remove quiz content from one clean workspace."
                to="/admin/questions"
                cta="Manage Questions"
                className="admin-card"
              />
              <ActionLinkCard
                title="Skill Catalog"
                text="Maintain the skills used in quizzes, reports, and interviews."
                to="/admin/skills"
                cta="Manage Skills"
                className="admin-card"
              />
              <ActionLinkCard
                title="Company Profiles"
                text="Keep target companies and test focus areas current and consistent."
                to="/admin/companies"
                cta="Manage Companies"
                className="admin-card"
              />
            </div>
          </section>

          <section className="section-panel admin-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <div className="admin-badge">Admin Access</div>
                <h3 className="mt-4 text-2xl font-semibold text-white">Create another admin safely.</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Add trusted admins directly from this panel without mixing account creation into
                  the public user flow.
                </p>
              </div>
              <div className="admin-badge">Admin only</div>
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

          {loading ? (
            <section className="section-panel admin-card">
              <div className="dashboard-metric-grid">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="balanced-card animate-pulse border-slate-700/40 bg-slate-900/60">
                    <div className="h-3 w-28 rounded-full bg-slate-700/70" />
                    <div className="mt-4 h-10 w-20 rounded-full bg-slate-700/60" />
                    <div className="mt-3 h-3 w-full rounded-full bg-slate-800/80" />
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="section-panel admin-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="admin-badge">Live Activity</div>
                  <h3 className="mt-4 text-2xl font-semibold text-white">Recent platform activity</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Scroll recent user and result data inside fixed panels instead of letting the
                    whole page stretch.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                <AdminScrollPanel
                  title="Recent Users"
                  subtitle="Latest registered users and roles."
                  items={safeUsers}
                  emptyText="No user activity yet."
                  renderItem={(item) => (
                    <ListRow
                      key={item._id}
                      title={item.name}
                      subtitle={item.email}
                      meta={item.role}
                    />
                  )}
                />

                <AdminScrollPanel
                  title="Recent Results"
                  subtitle="Latest saved quiz activity."
                  items={safeResults}
                  emptyText="No result activity yet."
                  renderItem={(item) => (
                    <ListRow
                      key={item._id}
                      title={item.userId?.name || "Unknown user"}
                      subtitle={`${item.score}/${item.total}`}
                      meta={item.company ? `${item.company} test` : "Initial test"}
                    />
                  )}
                />
              </div>

              <div className="mt-5">
                <AdminScrollPanel
                  title="Recent Interviews"
                  subtitle="Latest mock interview performance logs."
                  items={safeInterviews}
                  emptyText="No interview activity yet."
                  renderItem={(item) => (
                    <ListRow
                      key={item._id}
                      title={item.userId?.name || "Unknown user"}
                      subtitle={`${item.company || "General"} / ${item.role || "Interview"}`}
                      meta={`${item.overallScore || 0}% overall`}
                    />
                  )}
                />
              </div>
            </section>
          )}
        </div>

        <aside className="dashboard-sidebar">
          <section className="section-panel admin-card">
            <div className="admin-badge">Snapshot</div>
            <h3 className="mt-4 text-2xl font-semibold text-white">Platform coverage</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Keep the key operational signals visible without overloading the main management
              workspace.
            </p>

            <div className="dashboard-metric-grid mt-6">
              <MetricStatCard
                title="Admin Accounts"
                value={safeUsers.filter((item) => item.role === "admin").length}
                meta="Trusted operators"
                tone="cyan"
              />
              <MetricStatCard
                title="Student Accounts"
                value={Math.max(0, safeStats.userCount - safeUsers.filter((item) => item.role === "admin").length)}
                meta="Recent user sample"
                tone="violet"
              />
              <MetricStatCard
                title="Skills Covered"
                value={safeSkills.length}
                meta="Latest tracked skill entries"
                tone="emerald"
              />
            </div>
          </section>

          <ActivityCalendarCard
            days={(safeAnalytics.engagementLeaders || []).slice(0, 6).map((item, index) => ({
              dayKey: `leader-${index}-${item.name}`,
              count: item.currentStreak || 0,
              types: [`${item.currentStreak}d streak`, `${item.activeDays} active days`],
            }))}
            title="Engagement Leaders"
            subtitle="Students with the strongest current activity streaks."
            className="mt-6"
          />

          <BadgeStrip
            className="mt-6"
            title="Top Learner Badges"
            badges={[
              ...new Set(
                (safeAnalytics.engagementLeaders || [])
                  .flatMap((item) => item.badges || [])
                  .slice(0, 8),
              ),
            ]}
          />

          {loading ? (
            <section className="section-panel admin-card mt-6">
              <div className="empty-state">Loading catalog activity...</div>
            </section>
          ) : (
            <>
              <AdminScrollPanel
                title="Latest Skills"
                subtitle="Newest or recently updated skill catalog entries."
                items={safeSkills}
                emptyText="No skills added yet."
                className="mt-6"
                renderItem={(item) => (
                  <ListRow
                    key={item._id}
                    title={item.name}
                    subtitle={item.description || "No description"}
                    meta={item.category}
                  />
                )}
              />

              <AdminScrollPanel
                title="Latest Companies"
                subtitle="Current company profiles and focus-skill coverage."
                items={safeCompanies}
                emptyText="No company profiles yet."
                className="mt-6"
                renderItem={(item) => (
                  <ListRow
                    key={item._id}
                    title={item.name}
                    subtitle={item.description || "No description"}
                    meta={`${item.focusSkills?.length || 0} skills`}
                  />
                )}
              />
            </>
          )}
        </aside>
      </div>
    </AdminLayout>
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

function AdminScrollPanel({ title, subtitle, items, emptyText, renderItem, className = "" }) {
  return (
    <ScrollListPanel
      title={title}
      subtitle={subtitle}
      items={items}
      emptyText={emptyText}
      className={`admin-card ${className}`.trim()}
      renderItem={renderItem}
    />
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
