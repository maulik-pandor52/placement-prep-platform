import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import StudentLoginPage from "./pages/StudentLoginPage";
import StudentRegisterPage from "./pages/StudentRegisterPage";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import StudentOverviewPage from "./pages/StudentOverviewPage";
import StudentInsightsPage from "./pages/StudentInsightsPage";
import StudentOpportunitiesPage from "./pages/StudentOpportunitiesPage";
import StudentQuizPage from "./pages/StudentQuizPage";
import StudentResultPage from "./pages/StudentResultPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminQuestions from "./pages/AdminQuestions";
import AdminSkills from "./pages/AdminSkills";
import AdminCompanies from "./pages/AdminCompanies";
import StudentMockInterviewPage from "./pages/StudentMockInterviewPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public access */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<StudentLoginPage />} />
        <Route path="/register" element={<StudentRegisterPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <StudentOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <StudentInsightsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/opportunities"
          element={
            <ProtectedRoute>
              <StudentOpportunitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <StudentQuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/result"
          element={
            <ProtectedRoute>
              <StudentResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <StudentProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin redirectTo="/admin/login">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <ProtectedRoute requireAdmin redirectTo="/admin/login">
              <AdminQuestions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/skills"
          element={
            <ProtectedRoute requireAdmin redirectTo="/admin/login">
              <AdminSkills />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/companies"
          element={
            <ProtectedRoute requireAdmin redirectTo="/admin/login">
              <AdminCompanies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mock-interview"
          element={
            <ProtectedRoute>
              <StudentMockInterviewPage />
            </ProtectedRoute>
          }
        />

        {/* 404 fallback */}
        <Route
          path="*"
          element={
            <div className="app-canvas">
              <div className="page-wrap flex min-h-screen items-center justify-center">
                <div className="section-panel max-w-xl text-center">
                  <div className="soft-badge">PrepEasy</div>
                  <h1 className="mt-5 text-7xl font-black text-slate-100">404</h1>
                  <p className="mt-4 text-lg leading-8 text-slate-400">
                    This page is not available right now. Use the workspace links below to return to the active app.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link to="/dashboard" className="primary-btn">
                      Student Dashboard
                    </Link>
                    <Link to="/admin" className="secondary-btn">
                      Admin Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
