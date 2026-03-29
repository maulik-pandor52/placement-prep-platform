import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import PrepEasyLogo from "./PrepEasyLogo";

const navItems = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/questions", label: "Questions" },
  { to: "/admin/skills", label: "Skills" },
  { to: "/admin/companies", label: "Companies" },
];

export default function AdminLayout({ title, subtitle, children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

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
      <aside className="admin-shell fixed inset-y-0 left-0 hidden w-72 border-r border-cyan-400/10 text-slate-100 backdrop-blur lg:block">
        <div className="border-b border-slate-800/80 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
            Admin Hub
          </p>
          <div className="mt-3">
            <PrepEasyLogo
              subtitle="Manage questions, skills, companies, and platform data."
              textClassName="text-white"
              subtextClassName="text-slate-400"
              compact
            />
          </div>
        </div>

        <nav className="space-y-2 px-4 py-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-300 to-amber-300 text-slate-950 shadow-lg shadow-cyan-500/10"
                    : "text-slate-300 hover:bg-slate-900/80 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800/80 px-6 py-5">
          <div className="admin-card-muted px-4 py-4">
            <div className="text-sm font-semibold text-white">{user?.name || "Admin"}</div>
            <div className="mt-1 text-xs text-slate-400">{user?.email || ""}</div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="border-b border-slate-800/70 bg-slate-950/25 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
                Admin Workspace
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white">{title}</h2>
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Student View
              </Link>
              <button
                onClick={handleLogout}
                className="admin-btn px-4 py-2"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
