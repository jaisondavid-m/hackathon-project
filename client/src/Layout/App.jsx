import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { authService } from '../api/auth';
import Navbar from '../components/Navbar';
import Login from '../pages/Login';
import AdminDashboard from '../pages/AdminDashboard';
import FacultyDashboard from '../pages/FacultyDashboard';
import StudentDashboard from '../pages/StudentDashboard';
import Home from '../pages/Home';

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
  
  return <Outlet />;
}

function AuthenticatedLayout({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-[#EEF1F9] flex flex-col">
      <Navbar user={user} onLogout={onLogout} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="py-6 border-t border-slate-100/50 bg-white text-center text-xs text-slate-400 font-semibold tracking-wider uppercase">
        &copy; {new Date().getFullYear()} PCDP Attendance System &bull; All Rights Reserved
      </footer>
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

      {/* Protected dashboard routes with shared navbar layout */}
      <Route element={<AuthenticatedLayout user={user} onLogout={handleLogout} />}>
        <Route element={<ProtectedRoute user={user} allowedRole="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        
        <Route element={<ProtectedRoute user={user} allowedRole="faculty" />}>
          <Route path="/faculty" element={<FacultyDashboard />} />
        </Route>
        
        <Route element={<ProtectedRoute user={user} allowedRole="student" />}>
          <Route path="/student" element={<StudentDashboard user={user} />} />
        </Route>
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;