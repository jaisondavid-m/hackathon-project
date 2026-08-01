import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, X } from 'lucide-react';

function Navbar({ user, onLogout, toggleMobileSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

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

  const getNotificationContent = () => {
  switch (user.role) {
    case 'admin':
      return {
        title: 'Security Alert',
        message: 'Unauthorized activity has been detected. Please review the Audit Logs page to investigate and monitor the issue.',
        type: 'warning'
      };

    case 'faculty':
      return {
        title: 'Meeting Reminder',
        message: 'This is a reminder that you have a meeting scheduled from 11:00 AM to 11:30 AM in Seminar Hall 2.',
        type: 'info'
      };

    case 'student':
    default:
      return {
        title: 'Attendance Reminder',
        message: 'Please maintain a minimum attendance of 80% to remain eligible for the semester-end examinations.',
        type: 'action'
      };
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
          <button 
            onClick={() => setShowNotifications(true)}
            className="p-2 bg-[#7D53F6]/5 hover:bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl flex items-center justify-center border border-[#7D53F6]/10 cursor-pointer transition-colors shadow-sm focus:outline-none"
          >
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

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-md w-full border border-slate-100/85 overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  getNotificationContent().type === 'warning' ? 'bg-amber-500' :
                  getNotificationContent().type === 'info' ? 'bg-blue-500' : 'bg-[#7D53F6]'
                }`} />
                <span className="font-extrabold text-slate-800 text-sm sm:text-base uppercase tracking-wider">
                  {getNotificationContent().title}
                </span>
              </div>
              <button 
                onClick={() => setShowNotifications(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-xl transition-colors cursor-pointer focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-grow">
              <div className={`p-4 rounded-2xl border ${
                getNotificationContent().type === 'warning' ? 'bg-amber-50/30 border-amber-100 text-amber-900' :
                getNotificationContent().type === 'info' ? 'bg-blue-50/30 border-blue-100 text-blue-900' : 
                'bg-violet-50/30 border-violet-100 text-violet-900'
              }`}>
                <p className="text-sm font-semibold leading-relaxed">
                  {getNotificationContent().message}
                </p>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowNotifications(false)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-colors shadow-sm focus:outline-none ${
                  getNotificationContent().type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10' :
                  getNotificationContent().type === 'info' ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/10' : 
                  'bg-[#7D53F6] hover:bg-[#6C42E2] text-white shadow-[#7D53F6]/10'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
