import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminNoticesPage from './pages/AdminNoticesPage.jsx';
import AdminStudentDetailPage from './pages/AdminStudentDetailPage.jsx';
import AdminStudentsPage from './pages/AdminStudentsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import SecurityPage from './pages/SecurityPage.jsx';
import SecurityScansPage from './pages/SecurityScansPage.jsx';
import SecurityFindingPage from './pages/SecurityFindingPage.jsx';
import StudentAttendancePage from './pages/StudentAttendancePage.jsx';
import StudentDashboardPage from './pages/StudentDashboardPage.jsx';
import StudentFeesPage from './pages/StudentFeesPage.jsx';
import StudentMarksPage from './pages/StudentMarksPage.jsx';
import StudentNoticesPage from './pages/StudentNoticesPage.jsx';
import StudentProfilePage from './pages/StudentProfilePage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute role="student" />}>
          <Route path="/student" element={<StudentDashboardPage />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
          <Route path="/student/marks" element={<StudentMarksPage />} />
          <Route path="/student/attendance" element={<StudentAttendancePage />} />
          <Route path="/student/fees" element={<StudentFeesPage />} />
          <Route path="/student/notices" element={<StudentNoticesPage />} />
        </Route>

        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/students" element={<AdminStudentsPage />} />
          <Route path="/admin/students/:studentId" element={<AdminStudentDetailPage />} />
          <Route path="/admin/notices" element={<AdminNoticesPage />} />
        </Route>

        <Route element={<ProtectedRoute role="security_assessor" />}>
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/security/scans" element={<SecurityScansPage />} />
          <Route path="/security/scans/:scanId" element={<SecurityScansPage />} />
          <Route path="/security/findings" element={<SecurityFindingPage />} />
          <Route path="/security/findings/:findingId" element={<SecurityFindingPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  );
}