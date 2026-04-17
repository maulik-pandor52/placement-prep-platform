import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import PrepEasyLogo from "./PrepEasyLogo";

const navItems = [
  { to: "/dashboard", label: "Overview", short: "OV" },
  { to: "/insights", label: "Insights", short: "IN" },
  { to: "/opportunities", label: "Opportunities", short: "OP" },
  { to: "/quiz", label: "Quiz", short: "QZ" },
  { to: "/mock-interview", label: "Mock Interview", short: "MI" },
  { to: "/profile", label: "Profile", short: "PR" },
];

export default function StudentLayout({
  title,
  subtitle,
  actions,
  children,
}) {
  const navigate = useNavigate();
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  useEffect(() => {
    document.title = title ? `PrepEasy | ${title}` : "PrepEasy";
  }, [title]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-canvas">
      <div className="page-wrap workspace-shell">
        <div className="workspace-layout">
          <aside className="workspace-sidebar">
            <div className="workspace-sidebar-inner">
              <div className="workspace-brand">
                <div className="soft-badge">PrepEasy Student</div>
                <div className="mt-4">
                  <PrepEasyLogo
                    subtitle="One focused place for practice, readiness, and career momentum."
                    textClassName="text-white"
                    subtextClassName="text-slate-400"
                    compact
                  />
                </div>
              </div>

              <nav className="workspace-nav">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `workspace-nav-link ${isActive ? "workspace-nav-link-active" : ""}`.trim()
                    }
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {item.short}
                    </span>
                  </NavLink>
                ))}
              </nav>

              <div className="student-card mt-auto">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                  Workspace User
                </div>
                <div className="mt-3 text-lg font-semibold text-slate-100">
                  {user?.name || "Student"}
                </div>
                <div className="mt-1 text-sm text-slate-400">{user?.email || ""}</div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {user?.role === "admin" ? (
                    <Link to="/admin" className="ghost-btn">
                      Admin Area
                    </Link>
                  ) : null}
                  <button onClick={handleLogout} className="secondary-btn">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <div className="workspace-main">
            <header className="workspace-topbar">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="soft-badge">Student Workspace</div>
                  <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {title}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
                    {subtitle}
                  </p>
                </div>
                {actions ? <div className="workspace-action-group">{actions}</div> : null}
              </div>
            </header>

            <main className="mt-6">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
