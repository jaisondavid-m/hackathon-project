import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, X } from 'lucide-react';

function Navbar({ user, onLogout, toggleMobileSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    checkUnread();
  }, []);

  // Listen for local storage change events or custom dispatch triggers
  useEffect(() => {
    if (showNotifications) {
      loadUserNotifications();
      setHasUnread(false);
    }
  }, [showNotifications]);

  const checkUnread = () => {
    try {
      const stored = localStorage.getItem('pcdp_notifications');
      if (stored) {
        const notifs = JSON.parse(stored);
        const filtered = notifs.filter(n => {
          if (n.target === 'all') return true;
          if (n.target === user.role) return true;
          if (n.target === 'user' && n.targetEmail.toLowerCase() === user.emailid.toLowerCase()) return true;
          return false;
        });
        setHasUnread(filtered.length > 0);
      } else {
        setHasUnread(true); // default notification exists
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadUserNotifications = () => {
    try {
      let stored = localStorage.getItem('pcdp_notifications');
      let notifsList = [];
      if (stored) {
        notifsList = JSON.parse(stored);
      } else {
        // Pre-populate defaults
        notifsList = [
          {
            id: 'notif-1',
            title: 'Security Alert',
            message: 'Unauthorized activity has been detected. Please review the Audit Logs page to investigate and monitor the issue.',
            type: 'warning',
            target: 'admin',
            targetEmail: '',
            createdAt: new Date().toISOString()
          },
          {
            id: 'notif-2',
            title: 'Meeting Reminder',
            message: 'This is a reminder that you have a meeting scheduled from 11:00 AM to 11:30 AM in Seminar Hall 2.',
            type: 'info',
            target: 'faculty',
            targetEmail: '',
            createdAt: new Date().toISOString()
          },
          {
            id: 'notif-3',
            title: 'Attendance Reminder',
            message: 'Please maintain a minimum attendance of 80% to remain eligible for the semester-end examinations.',
            type: 'success',
            target: 'student',
            targetEmail: '',
            createdAt: new Date().toISOString()
          }
        ];
        localStorage.setItem('pcdp_notifications', JSON.stringify(notifsList));
      }

      // Filter targeted to user
      const filtered = notifsList.filter(n => {
        if (n.target === 'all') return true;
        if (n.target === user.role) return true;
        if (n.target === 'user' && n.targetEmail.toLowerCase() === user.emailid.toLowerCase()) return true;
        return false;
      });

      // Sort newest first
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  // Determine page title based on current path name
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'Users Management';
    if (path.includes('/admin/venues')) return 'Venue Management';
    if (path.includes('/admin/session-details')) return 'Session Details';
    if (path.includes('/admin/audit-logs')) return 'Audit Logs';
    if (path.includes('/admin/notifications')) return 'Notification Center';
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
          <button 
            onClick={() => setShowNotifications(true)}
            className="p-2 bg-[#7D53F6]/5 hover:bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl flex items-center justify-center border border-[#7D53F6]/10 cursor-pointer transition-colors shadow-sm focus:outline-none"
          >
            <Bell size={18} className="stroke-[2.5]" />
          </button>
          {hasUnread && (
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white animate-pulse" />
          )}
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
                <div className="w-2 h-2 rounded-full bg-[#7D53F6]" />
                <span className="font-extrabold text-slate-800 text-sm sm:text-base uppercase tracking-wider">
                  Notification Center ({notifications.length})
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
            <div className="p-6 overflow-y-auto flex-grow space-y-3.5">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 rounded-2xl border flex flex-col gap-1 ${
                      notif.type === 'warning' ? 'bg-amber-50/40 border-amber-100/80 text-amber-900' :
                      notif.type === 'error' ? 'bg-rose-50/40 border-rose-100/80 text-rose-900' : 
                      notif.type === 'success' ? 'bg-emerald-50/40 border-emerald-100/80 text-emerald-900' : 
                      'bg-sky-50/40 border-sky-100/80 text-sky-900'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      <span>{notif.type} Event</span>
                      <span>
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-800 leading-snug">{notif.title}</h4>
                    <p className="text-[11px] font-semibold leading-relaxed text-slate-600 mt-0.5">
                      {notif.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  No active notifications
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end flex-shrink-0">
              <button 
                onClick={() => setShowNotifications(false)}
                className="px-5 py-2.5 bg-[#7D53F6] hover:bg-[#6C42E2] text-white rounded-xl font-bold text-xs cursor-pointer transition-colors shadow-sm focus:outline-none"
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
