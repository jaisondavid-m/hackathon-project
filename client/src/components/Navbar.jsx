import React from 'react';
import { LogOut, User, ShieldAlert, Award, GraduationCap } from 'lucide-react';
import { authService } from '../api/auth';

function Navbar({ user, onLogout }) {
  const handleLogout = () => {
    authService.logout();
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  // Icon mapping for roles
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <ShieldAlert size={16} className="text-amber-600" />;
      case 'faculty':
        return <Award size={16} className="text-[#7D53F6]" />;
      default:
        return <GraduationCap size={16} className="text-emerald-600" />;
    }
  };

  return (
    <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-[#7D53F6] text-white p-2 rounded-xl flex items-center justify-center shadow-md shadow-[#7D53F6]/25">
              <span className="font-extrabold tracking-wider text-sm sm:text-base">PCDP</span>
            </div>
            <div>
              <span className="font-extrabold text-slate-800 text-lg sm:text-xl leading-none block">
                PCDP 4.0
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase leading-none block mt-0.5">
                Attendance System
              </span>
            </div>
          </div>

          {/* User profile & actions */}
          {user && (
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Profile Card */}
              <div className="flex items-center gap-3 bg-[#EEF1F9]/50 border border-slate-100 px-3.5 py-1.5 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 border border-slate-100">
                  <User size={16} />
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-semibold text-slate-700 text-sm block leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                    {getRoleIcon(user.role)}
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/70 border border-rose-100 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow-rose-100/50"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
