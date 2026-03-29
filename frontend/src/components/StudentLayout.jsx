import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import PrepEasyLogo from "./PrepEasyLogo";

const navItems = [
  { to: "/dashboard", label: "Overview" },
  { to: "/insights", label: "Insights" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/quiz", label: "Quiz" },
  { to: "/result", label: "Results" },
  { to: "/mock-interview", label: "Mock Interview" },
];

export default function StudentLayout({
  title,
  subtitle,
  actions,
  children,
}) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

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
      <div className="page-wrap">
        <header className="surface-panel px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
              <Link to="/dashboard" className="min-w-[220px]">
                <div className="soft-badge">PrepEasy Workspace</div>
                <div className="mt-3">
                  <PrepEasyLogo
                    subtitle="Practice, track progress, and prepare with confidence."
                  />
                </div>
              </Link>

              <nav className="flex flex-wrap gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-gradient-to-r from-violet-500 to-cyan-400 text-slate-950 shadow-lg shadow-violet-500/20"
                          : "text-slate-300 hover:bg-slate-800/90 hover:text-slate-50"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {user?.role === "admin" ? (
                <Link to="/admin" className="secondary-btn">
                  Admin Area
                </Link>
              ) : null}
              <button onClick={handleLogout} className="secondary-btn">
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="hero-panel mt-6 overflow-hidden px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="soft-badge">Student Workspace</div>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-100/85 sm:text-base">
                {subtitle}
              </p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </section>

        <main className="mt-6">{children}</main>
      </div>
    </div>
  );
}
