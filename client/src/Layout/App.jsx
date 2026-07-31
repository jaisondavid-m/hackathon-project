import React, { useState, useEffect } from 'react';
import { authService } from '../api/auth';
import Navbar from '../components/Navbar';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
  };

  const handleLogout = () => {
    setUser(null);
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

  // Render Login page if not authenticated
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Render Main Layout with Dashboard if authenticated
  return (
    <div className="min-h-screen bg-[#EEF1F9] flex flex-col">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="flex-grow">
        <Dashboard user={user} />
      </main>
      <footer className="py-6 border-t border-slate-100/50 bg-white text-center text-xs text-slate-400 font-semibold tracking-wider uppercase">
        &copy; {new Date().getFullYear()} PCDP Attendance System &bull; All Rights Reserved
      </footer>
    </div>
  );
}

export default App;