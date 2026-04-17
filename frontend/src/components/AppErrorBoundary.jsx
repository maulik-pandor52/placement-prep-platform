import React from "react";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "A UI error interrupted the current page.",
    };
  }

  componentDidCatch(error, info) {
    console.error("AppErrorBoundary caught an application error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-canvas">
          <div className="page-wrap flex min-h-screen items-center justify-center">
            <div className="section-panel max-w-2xl">
              <div className="soft-badge">PrepEasy Recovery</div>
              <h1 className="mt-5 panel-title text-3xl">This page hit a UI problem</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                The app stayed open, but one screen failed to render correctly. Use the links below
                to continue, then refresh if the same issue appears again.
              </p>
              <div className="mt-5 rounded-[20px] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {this.state.errorMessage}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    window.location.href = "/dashboard";
                  }}
                >
                  Student Dashboard
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    window.location.href = "/admin";
                  }}
                >
                  Admin Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
