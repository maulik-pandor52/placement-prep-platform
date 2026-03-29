import { Link, NavLink, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
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
                <div className="soft-badge">Placement Prep</div>
                <div className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                  Career Readiness Studio
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Practice, track progress, and prepare with confidence.
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
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-white hover:text-slate-900"
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
              <div className="soft-badge bg-white/12 text-white">Student Workspace</div>
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
