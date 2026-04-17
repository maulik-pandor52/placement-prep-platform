import React from "react";

class RenderGuard extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("RenderGuard caught a UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="section-panel">
          <div className="soft-badge">UI Notice</div>
          <h2 className="mt-4 panel-title">This section could not load</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            The rest of the dashboard is still available. Refresh the page if this keeps happening.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RenderGuard;
