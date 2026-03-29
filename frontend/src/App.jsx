import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
              <h1 className="text-7xl font-bold text-gray-800 mb-4">404</h1>
              <p className="text-2xl text-gray-600 mb-8">
                Oops! Page not found.
              </p>
              <a
                href="/dashboard"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-4 rounded-xl shadow-md transition"
              >
                Return to Dashboard
              </a>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
