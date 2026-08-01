import React from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  User, Mail, Shield, BookOpen, GraduationCap, Key,
  CheckCircle, Layers, Sparkles
} from 'lucide-react';

function Profile() {
  const context = useOutletContext() || {};
  let user = context.user;

  // Fallback to localStorage if context user is not present
  if (!user) {
    try {
      user = JSON.parse(localStorage.getItem('pcdp_user') || '{}');
    } catch (e) {
      user = {};
    }
  }

  const role = user?.role || 'student';

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleConfig = () => {
    switch (role) {
      case 'admin':
        return {
          label: 'System Administrator',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-100',
          gradient: 'from-slate-900 via-indigo-950 to-slate-900',
          icon: Shield,
          idPrefix: 'ADM-2024-00',
          dept: 'System Administration & Security',
          responsibilities: [
            'User & Role Management',
            'Venue Geofence Configuration',
            'OTP Bounding Mapping',
            'System Audit Log Inspection',
            'Active Session Monitoring'
          ]
        };
      case 'faculty':
        return {
          label: 'Faculty Staff',
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-100',
          gradient: 'from-[#4F46E5] via-[#7C3AED] to-[#9333EA]',
          icon: Key,
          idPrefix: 'FAC-2024-00',
          dept: 'Computer Science & Engineering',
          responsibilities: [
            'Class OTP & QR Code Generation',
            'Time Table & Schedule Management',
            'Live Attendance Session Monitoring',
            'Student Attendance Verification'
          ]
        };
      default:
        return {
          label: 'Undergraduate Student',
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
          gradient: 'from-blue-600 via-indigo-600 to-violet-600',
          icon: GraduationCap,
          idPrefix: '2023CSE0',
          dept: 'Computer Science & Engineering',
          responsibilities: [
            'Geofenced OTP Attendance Marking',
            'QR Code Scan Verification',
            'Attendance History Tracking'
          ]
        };
    }
  };

  const roleConfig = getRoleConfig();
  const HeaderIcon = roleConfig.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn">

      {/* Main Profile Info Card */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md overflow-hidden">
        {/* Banner Header */}
        <div className={`h-24 sm:h-28 bg-gradient-to-r ${roleConfig.gradient} relative flex items-end p-4 sm:p-6`}>
          <div className="absolute top-2 right-4 text-white/10">
            <HeaderIcon size={90} />
          </div>
          <div className="flex items-center gap-4 translate-y-8 sm:translate-y-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center text-slate-800 text-xl sm:text-2xl font-black">
              {getInitials(user?.name)}
            </div>
          </div>
        </div>

        <div className="pt-10 sm:pt-12 p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* User Name & Role Pill */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">{user?.name || 'User Name'}</h2>
              <p className="text-slate-400 font-semibold text-xs mt-0.5">{user?.emailid || 'user@example.com'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${roleConfig.badgeBg}`}>
                {roleConfig.label}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                <CheckCircle size={12} />
                <span>Active</span>
              </span>
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">

            {/* Full Name */}
            <div className="p-3.5 sm:p-4 bg-slate-50/60 border border-slate-100 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-[#7D53F6]/10 text-[#7D53F6] rounded-lg flex-shrink-0">
                <User size={18} />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Full Name</span>
                <span className="font-extrabold text-slate-800 text-sm truncate block mt-0.5">
                  {user?.name || 'N/A'}
                </span>
              </div>
            </div>

            {/* Reference ID */}
            <div className="p-3.5 sm:p-4 bg-slate-50/60 border border-slate-100 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg flex-shrink-0">
                <HeaderIcon size={18} />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Reference ID</span>
                <span className="font-extrabold text-slate-800 text-sm truncate block mt-0.5 font-mono">
                  {roleConfig.idPrefix}{user?.id || '01'}
                </span>
              </div>
            </div>

            {/* Department */}
            <div className="p-3.5 sm:p-4 bg-slate-50/60 border border-slate-100 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg flex-shrink-0">
                <BookOpen size={18} />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Department</span>
                <span className="font-extrabold text-slate-800 text-sm truncate block mt-0.5">
                  {roleConfig.dept}
                </span>
              </div>
            </div>

            {/* Role Specific Extra Field */}
            {role === 'student' ? (
              <div className="p-3.5 sm:p-4 bg-slate-50/60 border border-slate-100 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg flex-shrink-0">
                  <GraduationCap size={18} />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Year / Semester</span>
                  <span className="font-extrabold text-slate-800 text-sm truncate block mt-0.5">
                    III Year (6th Semester)
                  </span>
                </div>
              </div>
            ) : role === 'faculty' ? (
              <div className="p-3.5 sm:p-4 bg-slate-50/60 border border-slate-100 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg flex-shrink-0">
                  <Layers size={18} />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Assigned Classes</span>
                  <span className="font-extrabold text-slate-800 text-sm truncate block mt-0.5">
                    CS101, CS202, CS305
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 sm:p-4 bg-slate-50/60 border border-slate-100 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg flex-shrink-0">
                  <Shield size={18} />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Security Level</span>
                  <span className="font-extrabold text-slate-800 text-sm truncate block mt-0.5">
                    Level 5 - Root Admin Access
                  </span>
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="p-3.5 sm:p-4 bg-slate-50/60 border border-slate-100 rounded-xl flex items-center gap-3 md:col-span-2">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-lg flex-shrink-0">
                <Mail size={18} />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Email Address</span>
                <span className="font-extrabold text-slate-800 text-sm truncate block mt-0.5">
                  {user?.emailid || 'N/A'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
