import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';

function Navbar({ user, onLogout, toggleMobileSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  // Determine page title based on current path name
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'Users Management';
    if (path.includes('/admin/venues')) return 'Venue Management';
    if (path.includes('/admin/session-details')) return 'Session Details';
    if (path.includes('/admin/audit-logs')) return 'Audit Logs';
    if (path.includes('/faculty/dashboard')) return 'Faculty Dashboard';
    if (path.includes('/faculty/otp')) return 'OTP & QR Code';
    if (path.includes('/faculty/timetable')) return 'Time Table';
    if (path.includes('/faculty/my-attendance')) return 'My Attendance';
    if (path.includes('/student/otp')) return 'Mark Attendance';
    if (path.includes('/student/history')) return 'Attendance History';
    if (path.includes('/profile')) return 'Profile Overview';
    return 'Dashboard';
  };

  // Helper to extract initials for profile avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'faculty': return 'Faculty Staff';
      default: return 'Student Console';
    }
  };

  return (
    <header className="h-16 px-4 sm:px-8 flex justify-between items-center bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm flex-shrink-0">
      {/* Left Side: Burger Menu Toggle & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={toggleMobileSidebar}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer"
        >
          <Menu size={22} />
        </button>
        <div className="text-left">
          <h1 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
            {getPageTitle()}
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-400 font-bold tracking-wide mt-0.5 leading-none hidden xs:block">
            Welcome back, {user?.name || 'User'}. Here's what's happening today.
          </p>
        </div>
      </div>

      {/* Right Side: Actions Widget */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Bell Notification widget */}
        <div className="relative">
          <button className="p-2 bg-[#7D53F6]/5 hover:bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl flex items-center justify-center border border-[#7D53F6]/10 cursor-pointer transition-colors shadow-sm">
            <Bell size={18} className="stroke-[2.5]" />
          </button>
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#7D53F6] rounded-full border border-white" />
        </div>

        {/* Profile Card */}
        <button
          onClick={() => navigate(`/${user.role}/profile`)}
          className="flex items-center gap-2 sm:gap-3 bg-[#EEF1F9]/50 hover:bg-[#EEF1F9] border border-slate-100 px-3 py-1.5 rounded-2xl cursor-pointer transition-all duration-150 text-left focus:outline-none"
        >
          {/* Avatar Circle */}
          <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center font-extrabold text-xs text-[#7D53F6] border border-slate-100 flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="text-left hidden sm:block">
            <span className="font-bold text-slate-700 text-sm block leading-tight">
              {user?.name || 'User'}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5 leading-none">
              {getRoleLabel(user.role)}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}

export default Navbar;
