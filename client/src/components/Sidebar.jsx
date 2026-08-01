import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Settings, Layers, Key, X, MapPin, Calendar, Clock, ClipboardList, UserCheck, User, LogOut, LayoutDashboard, Bell } from 'lucide-react';

function Sidebar({ user, mobileOpen, onCloseMobile, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  // Determine active item based on current route path
  const getActiveItem = () => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/venues')) return 'venues';
    if (path.includes('/admin/working-days')) return 'working-days';
    if (path.includes('/admin/session-details')) return 'session-details';
    if (path.includes('/admin/otp-mapping')) return 'otp-mapping';
    if (path.includes('/admin/audit-logs')) return 'audit';
    if (path.includes('/admin/notifications')) return 'notifications';
    if (path.includes('/faculty/dashboard')) return 'faculty-dashboard';
    if (path.includes('/faculty/otp')) return 'otp';
    if (path.includes('/faculty/timetable')) return 'timetable';
    if (path.includes('/faculty/my-attendance')) return 'my-attendance';
    if (path.includes('/student/dashboard')) return 'student-dashboard';
    if (path.includes('/student/otp')) return 'student-otp';
    if (path.includes('/student/history')) return 'student-history';
    if (path.includes('/student/profile')) return 'student-profile';
    return '';
  };

  const activeItem = getActiveItem();

  // Define role-specific menus
  const menuItems = {
    admin: [
      { id: 'venues', path: '/admin/venues', label: 'Venue Management', icon: MapPin },
      { id: 'otp-mapping', path: '/admin/otp-mapping', label: 'OTP Mapping', icon: Layers },
      { id: 'session-details', path: '/admin/session-details', label: 'Session Details', icon: Clock },
      { id: 'audit', path: '/admin/audit-logs', label: 'Audit Logs', icon: Layers },
      { id: 'users', path: '/admin/users', label: 'Users Management', icon: Users },
      { id: 'notifications', path: '/admin/notifications', label: 'Send Notifications', icon: Bell },
    ],
    faculty: [
      { id: 'faculty-dashboard', path: '/faculty/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'otp', path: '/faculty/otp', label: 'Attendance', icon: ClipboardList },
      { id: 'timetable', path: '/faculty/timetable', label: 'Time Table', icon: Calendar },
      { id: 'my-attendance', path: '/faculty/my-attendance', label: 'My Attendance', icon: UserCheck },
    ],
    student: [
      { id: 'student-dashboard', path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'student-otp', path: '/student/otp', label: 'Mark Attendance', icon: UserCheck },
      { id: 'student-history', path: '/student/history', label: 'Attendance History', icon: Layers },
      { id: 'student-profile', path: '/student/profile', label: 'Profile', icon: User },
    ],
  };

  const currentMenu = menuItems[user.role] || [];

  const handleNavClick = (path) => {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white flex-grow">
      {/* Logo area */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="PCDP Logo" className="h-8 w-auto flex-shrink-0" />
          <span className="font-black text-slate-800 text-lg sm:text-xl">
            PCDP <span className="text-[#7D53F6]">v4.0</span>
          </span>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none p-1"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Menu Label */}
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 mt-6 mb-2 flex-shrink-0">
        Main Menu
      </div>

      {/* Menu Navigation List */}
      <nav className="flex-grow space-y-1.5 px-3 overflow-y-auto">
        {currentMenu.map((item) => {
          const isActive = activeItem === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-0 ${isActive
                  ? 'bg-[#7D53F6] text-white font-bold shadow-md shadow-[#7D53F6]/25'
                  : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-800'
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span className="text-sm font-semibold tracking-wide">{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Logout Session Button */}
      <div className="px-3 py-2 border-t border-slate-100/50 flex-shrink-0">
        <button
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            onLogout();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-200 cursor-pointer focus:outline-none"
        >
          <LogOut size={18} className="text-rose-400" />
          <span className="text-sm font-semibold tracking-wide">Logout Session</span>
        </button>
      </div>

      {/* Footer info */}
      <div className="p-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center flex-shrink-0">
        &copy; {new Date().getFullYear()} PCDP Attendance
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r border-slate-100 shadow-sm h-screen sticky top-0 flex-shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden">
          <aside className="w-64 bg-white h-full shadow-2xl flex flex-col animate-slideRight">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

export default Sidebar;
