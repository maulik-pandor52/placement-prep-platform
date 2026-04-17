import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  redirectTo = "/login",
}) {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  if (!token) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requireAdmin && user?.role && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!requireAdmin && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
