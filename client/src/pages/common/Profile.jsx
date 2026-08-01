import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  User, Mail, Shield, BookOpen, GraduationCap, Award, Key, 
  CheckCircle, Clock, MapPin, Layers, Sparkles 
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
    <div className="max-w-4xl mx-auto space-y-6 py-2 animate-fadeIn">
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <div className="p-3 bg-[#7D53F6]/10 text-[#7D53F6] rounded-2xl">
          <User size={24} className="stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Profile Overview</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">
            User Identification & Credential Details
          </p>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white rounded-[32px] border border-slate-100/80 shadow-xl overflow-hidden">
        {/* Banner Header */}
        <div className={`h-36 bg-gradient-to-r ${roleConfig.gradient} relative flex items-end p-6 sm:p-8`}>
          <div className="absolute top-4 right-6 text-white/10">
            <HeaderIcon size={120} />
          </div>
          <div className="flex items-center gap-4 translate-y-12">
            <div className="w-24 h-24 rounded-3xl bg-white shadow-xl border-4 border-white flex items-center justify-center text-slate-800 text-3xl font-black">
              {getInitials(user?.name)}
            </div>
          </div>
        </div>

        <div className="pt-16 p-6 sm:p-8 space-y-8">
          {/* User Name & Role Pill */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800">{user?.name || 'User Name'}</h2>
              <p className="text-slate-400 font-semibold text-sm mt-0.5">{user?.emailid || 'user@example.com'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${roleConfig.badgeBg}`}>
                {roleConfig.label}
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1.5">
                <CheckCircle size={14} />
                <span>Active Account</span>
              </span>
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Full Name */}
            <div className="p-5 bg-slate-50/60 border border-slate-100 rounded-2xl flex items-start gap-4">
              <div className="p-2.5 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl flex-shrink-0">
                <User size={20} />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Full Name</span>
                <span className="font-extrabold text-slate-800 text-base truncate block mt-1">
                  {user?.name || 'N/A'}
                </span>
              </div>
            </div>

            {/* Reference ID */}
            <div className="p-5 bg-slate-50/60 border border-slate-100 rounded-2xl flex items-start gap-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl flex-shrink-0">
                <HeaderIcon size={20} />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Reference ID</span>
                <span className="font-extrabold text-slate-800 text-base truncate block mt-1 font-mono">
                  {roleConfig.idPrefix}{user?.id || '01'}
                </span>
              </div>
            </div>

            {/* Department */}
            <div className="p-5 bg-slate-50/60 border border-slate-100 rounded-2xl flex items-start gap-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl flex-shrink-0">
                <BookOpen size={20} />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Department</span>
                <span className="font-extrabold text-slate-800 text-base truncate block mt-1">
                  {roleConfig.dept}
                </span>
              </div>
            </div>

            {/* Role Specific Extra Field */}
            {role === 'student' ? (
              <div className="p-5 bg-slate-50/60 border border-slate-100 rounded-2xl flex items-start gap-4">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl flex-shrink-0">
                  <GraduationCap size={20} />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Year / Semester</span>
                  <span className="font-extrabold text-slate-800 text-base truncate block mt-1">
                    III Year (6th Semester)
                  </span>
                </div>
              </div>
            ) : role === 'faculty' ? (
              <div className="p-5 bg-slate-50/60 border border-slate-100 rounded-2xl flex items-start gap-4">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl flex-shrink-0">
                  <Layers size={20} />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Assigned Classes</span>
                  <span className="font-extrabold text-slate-800 text-base truncate block mt-1">
                    CS101, CS202, CS305
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-slate-50/60 border border-slate-100 rounded-2xl flex items-start gap-4">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl flex-shrink-0">
                  <Shield size={20} />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Security Level</span>
                  <span className="font-extrabold text-slate-800 text-base truncate block mt-1">
                    Level 5 - Root Admin Access
                  </span>
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="p-5 bg-slate-50/60 border border-slate-100 rounded-2xl flex items-start gap-4 md:col-span-2">
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl flex-shrink-0">
                <Mail size={20} />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Email Address</span>
                <span className="font-extrabold text-slate-800 text-base truncate block mt-1">
                  {user?.emailid || 'N/A'}
                </span>
              </div>
            </div>

          </div>

          {/* Module Privileges / Responsibilities Card */}
          <div className="p-6 bg-[#EEF1F9]/40 border border-slate-100 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-slate-700 font-extrabold text-sm uppercase tracking-wider">
              <Sparkles size={16} className="text-[#7D53F6]" />
              <span>Role Permissions & Authorized Scope</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {roleConfig.responsibilities.map((resp, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5"
                >
                  <CheckCircle size={13} className="text-emerald-500" />
                  <span>{resp}</span>
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Profile;
