import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet, useOutletContext, useLocation } from 'react-router-dom';
import { authService } from '../api/auth';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Login from '../pages/common/Login';
import UserManagement from '../pages/admin/UserManagement';
import VenueManagement from '../pages/admin/VenueManagement';
import OtpMapping from '../pages/admin/OtpMapping';
import SessionDetails from '../pages/admin/SessionDetails';
import AuditLogs from '../pages/admin/AuditLogs';
import FacultyDashboard from '../pages/faculty/FacultyDashboard';
import OTPGeneration from '../pages/faculty/OTPGeneration';
import FacultyTimeTable from '../pages/faculty/FacultyTimeTable';
import FacultyAttendance from '../pages/faculty/FacultyAttendance';
import StudentDashboard from '../pages/student/StudentDashboard';
import OTPAttendance from '../pages/student/OTPAttendance';
import StudentHistory from '../pages/student/StudentHistory';
import StudentProfile from '../pages/student/StudentProfile';
import Home from '../pages/common/Home';

function ProtectedRoute({ user, allowedRole }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'faculty') return <Navigate to="/faculty" replace />;
    if (user.role === 'student') return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet context={useOutletContext()} />;
}

function DashboardLayout({ user, onLogout }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Page label mapping for breadcrumbs
  const getTabLabel = () => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'Users Management';
    if (path.includes('/admin/venues')) return 'Venue Management';
    if (path.includes('/admin/otp-mapping')) return 'OTP Bounding Mapping';
    if (path.includes('/admin/session-details')) return 'Session Details';
    if (path.includes('/admin/audit-logs')) return 'Audit Logs';
    if (path.includes('/faculty/otp')) return 'OTP & QR Code';
    if (path.includes('/faculty/timetable')) return 'Time Table';
    if (path.includes('/faculty/my-attendance')) return 'My Attendance';
    if (path.includes('/student/otp')) return 'Mark Attendance';
    if (path.includes('/student/history')) return 'Attendance History';
    if (path.includes('/profile')) return 'Profile Overview';
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-[#EEF1F9] flex">
      {/* Role-based Left Sidebar */}
      <Sidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Right Content Section */}
      <div className="flex-grow flex flex-col min-h-screen">
        {/* Horizontal Action Header */}
        <Navbar
          user={user}
          onLogout={onLogout}
          toggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* Content View wrap */}
        <div className="flex-grow p-4 sm:p-8 flex flex-col">

          {/* Wrapper white card container */}
          <main className="bg-white rounded-[32px] border border-slate-100/80 shadow-md p-6 sm:p-8 flex-grow">
            <Outlet context={{ user, onLogout }} />
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Try to restore user session on mount
    const storedUser = authService.getCurrentUser();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (loggedInUser.role === 'faculty') {
      navigate('/faculty', { replace: true });
    } else if (loggedInUser.role === 'student') {
      navigate('/student', { replace: true });
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF1F9] flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#7D53F6]/30 border-t-[#7D53F6] rounded-full animate-spin mb-4" />
        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Loading System...
        </span>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root redirect route */}
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : user.role === 'admin' ? (
            <Navigate to="/admin" replace />
          ) : user.role === 'faculty' ? (
            <Navigate to="/faculty" replace />
          ) : (
            <Navigate to="/student" replace />
          )
        }
      />

      {/* Login route - redirects to dashboard if already authenticated */}
      <Route
        path="/login"
        element={
          user ? (
            user.role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : user.role === 'faculty' ? (
              <Navigate to="/faculty" replace />
            ) : (
              <Navigate to="/student" replace />
            )
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} />
          )
        }
      />

      {/* Home Route */}
      <Route path="/home" element={<Home />} />

      {/* Protected routes under the unified DashboardLayout */}
      <Route element={<DashboardLayout user={user} onLogout={handleLogout} />}>
        {/* Admin routes */}
        <Route element={<ProtectedRoute user={user} allowedRole="admin" />}>
          <Route path="/admin">
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="venues" element={<VenueManagement />} />
            <Route path="otp-mapping" element={<OtpMapping />} />
            <Route path="session-details" element={<SessionDetails />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
        </Route>

        {/* Faculty routes */}
        <Route element={<ProtectedRoute user={user} allowedRole="faculty" />}>
          <Route path="/faculty" element={<FacultyDashboard />}>
            <Route index element={<Navigate to="otp" replace />} />
            <Route path="otp" element={<OTPGeneration />} />
            <Route path="timetable" element={<FacultyTimeTable />} />
            <Route path="my-attendance" element={<FacultyAttendance />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
        </Route>

        {/* Student routes */}
        <Route element={<ProtectedRoute user={user} allowedRole="student" />}>
          <Route path="/student" element={<StudentDashboard user={user} />}>
            <Route index element={<Navigate to="otp" replace />} />
            <Route path="otp" element={<OTPAttendance />} />
            <Route path="history" element={<StudentHistory />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;