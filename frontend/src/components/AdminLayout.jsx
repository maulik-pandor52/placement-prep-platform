import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import PrepEasyLogo from "./PrepEasyLogo";

const navItems = [
  { to: "/admin", label: "Overview", short: "OV", end: true },
  { to: "/admin/questions", label: "Questions", short: "QB" },
  { to: "/admin/skills", label: "Skills", short: "SK" },
  { to: "/admin/companies", label: "Companies", short: "CP" },
];

export default function AdminLayout({ title, subtitle, children }) {
  const navigate = useNavigate();
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  useEffect(() => {
    document.title = title ? `PrepEasy Admin | ${title}` : "PrepEasy Admin";
  }, [title]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="admin-canvas">
      <div className="page-wrap workspace-shell">
        <div className="workspace-layout">
          <aside className="workspace-sidebar">
            <div className="workspace-sidebar-inner">
              <div className="workspace-brand">
                <div className="admin-badge">PrepEasy Admin</div>
                <div className="mt-4">
                  <PrepEasyLogo
                    subtitle="A dedicated control layer for question banks, skill data, companies, and platform activity."
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
                    end={item.end}
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

              <div className="admin-card-muted mt-auto px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                  Active Admin
                </div>
                <div className="mt-3 text-lg font-semibold text-white">{user?.name || "Admin"}</div>
                <div className="mt-1 text-sm text-slate-400">{user?.email || ""}</div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to="/dashboard" className="ghost-btn">
                    Student View
                  </Link>
                  <button onClick={handleLogout} className="admin-btn">
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
                  <div className="admin-badge">Admin Workspace</div>
                  <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {title}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">{subtitle}</p>
                </div>
              </div>
            </header>

            <main className="mt-6">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
