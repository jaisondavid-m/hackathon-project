import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  User, Mail, Shield, BookOpen, Key, Info, Edit3, Check, 
  MapPin, Phone, Calendar, Hash, Award, ShieldCheck, Sparkles,
  Sun, Sunset, Moon
} from 'lucide-react';

function Profile() {
  const context = useOutletContext() || {};
  let user = context.user;
  const [greeting, setGreeting] = useState('Welcome Back');

  // Fallback to localStorage if context user is not present
  if (!user) {
    try {
      user = JSON.parse(localStorage.getItem('pcdp_user') || '{}');
    } catch (e) {
      user = {};
    }
  }

  const role = user?.role || 'student';

  useEffect(() => {
    // Generate warm greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return <Sun className="text-amber-400 animate-spin-slow" size={24} />;
    if (hour < 17) return <Sparkles className="text-amber-300 animate-pulse" size={24} />;
    return <Moon className="text-indigo-200" size={24} />;
  };

  const getProfileData = () => {
    const defaultName = user?.name || 'Jaison David';
    const defaultEmail = user?.emailid || 'jaisondavidm.cs25@bitsathy.ac.in';
    const registerNum = `2023CSE0${user?.id || '2'}`;

    switch (role) {
      case 'admin':
        return {
          roleLabel: 'System Administrator',
          roleColor: 'from-[#7D53F6] via-indigo-600 to-indigo-700',
          personal: {
            title: 'Personal Details',
            fields: [
              { label: 'Full Name', value: defaultName, icon: User },
              { label: 'Mobile Number', value: '+91 99999 88888', icon: Phone },
              { label: 'Admin ID', value: `ADM-2024-00${user?.id || '1'}`, icon: Hash },
              { label: 'Date of Birth', value: '10 October 1980', icon: Calendar },
              { label: 'Email Address', value: defaultEmail, icon: Mail },
              { label: 'Address', value: 'Admin Block, BITS Campus, Erode, India', icon: MapPin }
            ]
          },
          academic: {
            title: 'System Access & Credentials',
            fields: [
              { label: 'Security Role', value: 'Root Administrator', icon: Shield },
              { label: 'Access Clearance', value: 'Level 5 - Root Admin Access', icon: ShieldCheck },
              { label: 'Managed Nodes', value: 'All Block Networks', icon: BookOpen },
              { label: 'Office Room', value: 'Server Room 01', icon: Key },
              { label: 'Year Mapped', value: '2026', icon: Calendar }
            ]
          },
          other: {
            title: 'Other Information',
            fields: [
              { label: 'Lead Security Auditor', value: 'Dr. Anand Kumar', icon: User },
              { label: 'Email Institution', value: defaultEmail, icon: Mail }
            ]
          }
        };

      case 'faculty':
        return {
          roleLabel: 'Faculty Staff Member',
          roleColor: 'from-violet-600 via-indigo-600 to-pink-500',
          personal: {
            title: 'Personal Details',
            fields: [
              { label: 'Full Name', value: defaultName, icon: User },
              { label: 'Mobile Number', value: '+91 98765 43210', icon: Phone },
              { label: 'Employee ID', value: `FAC-2024-00${user?.id || '1'}`, icon: Hash },
              { label: 'Date of Birth', value: '22 August 1985', icon: Calendar },
              { label: 'Email Address', value: defaultEmail, icon: Mail },
              { label: 'Address', value: 'Faculty Quarters, BITS Campus, Erode, India', icon: MapPin }
            ]
          },
          academic: {
            title: 'Academic Details',
            fields: [
              { label: 'Department', value: 'Computer Science & Engineering', icon: BookOpen },
              { label: 'Designation', value: 'Associate Professor', icon: Award },
              { label: 'Qualification', value: 'Ph.D. in CSE', icon: ShieldCheck },
              { label: 'Office Room', value: 'CSE Block Room 304', icon: Key },
              { label: 'Joining Year', value: '2018', icon: Calendar }
            ]
          },
          other: {
            title: 'Other Information',
            fields: [
              { label: 'Assigned Mentoring', value: 'Batch 2023-2027 Sec A', icon: User },
              { label: 'Email Institution', value: defaultEmail, icon: Mail }
            ]
          }
        };

      case 'student':
      default:
        return {
          roleLabel: 'Undergraduate Student',
          roleColor: 'from-[#7D53F6] via-[#5F35E2] to-[#B026FF]',
          personal: {
            title: 'Personal Details',
            fields: [
              { label: 'Full Name', value: defaultName, icon: User },
              { label: 'Mobile Number', value: '+91 93456 78901', icon: Phone },
              { label: 'Register Number', value: registerNum, icon: Hash },
              { label: 'Date of Birth', value: '14 May 2004', icon: Calendar },
              { label: 'Email Address', value: defaultEmail, icon: Mail },
              { label: 'Address', value: 'Coimbatore, Tamil Nadu, India', icon: MapPin }
            ]
          },
          academic: {
            title: 'Academic Details',
            fields: [
              { label: 'Department', value: 'Computer Science & Engineering', icon: BookOpen },
              { label: 'Year', value: 'III Year', icon: Award },
              { label: 'Semester', value: '6th Semester', icon: ShieldCheck },
              { label: 'Section', value: 'A', icon: Key },
              { label: 'Batch', value: '2023 - 2027', icon: Calendar }
            ]
          },
          other: {
            title: 'Other Information',
            fields: [
              { label: 'Faculty Advisor', value: 'Dr. Anand Kumar', icon: User },
              { label: 'Email Institution', value: defaultEmail, icon: Mail }
            ]
          }
        };
    }
  };

  const pData = getProfileData();

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fadeIn pb-10">
      
      {/* 1. Warm Welcoming Greeting Card */}
      <div className={`relative overflow-hidden rounded-[32px] bg-gradient-to-r ${pData.roleColor} text-white shadow-xl shadow-indigo-100/50 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group`}>
        {/* Glow rings in background */}
        <div className="absolute top-[-100px] right-[-100px] w-[350px] h-[350px] rounded-full bg-white/10 blur-2xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
        <div className="absolute bottom-[-150px] left-[-150px] w-[300px] h-[300px] rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 sm:gap-6 z-10">
          {/* Avatar Glass Box */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/20 shadow-lg flex items-center justify-center font-black text-2xl sm:text-3xl text-white transform hover:rotate-3 transition-transform duration-300 flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border border-white/10 shadow-sm leading-none">
                {pData.roleLabel}
              </span>
              <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wide leading-none">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span>Active Status</span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight pt-1 flex items-center gap-2">
              {greeting}, {user?.name || 'User'}!
              {getGreetingIcon()}
            </h2>
            <p className="text-[11px] sm:text-xs text-white/80 font-bold tracking-wide mt-0.5">
              Welcome back to your workspace console overview.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Personal Information Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-slate-100 shadow-xl shadow-slate-100/30 p-6 sm:p-8 space-y-6 hover:shadow-2xl hover:border-slate-200/80 transition-all duration-300">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#7D53F6]/10 text-[#7D53F6] rounded-2xl shadow-sm">
              <User size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase leading-tight">
                {pData.personal.title}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 leading-none">
                Identity Profile Settings
              </p>
            </div>
          </div>
          
          <button
            onClick={() => alert("Profile edits must be requested via the campus Registrar Office.")}
            className="flex items-center gap-1.5 border border-[#7D53F6]/20 bg-[#7D53F6]/5 hover:bg-[#7D53F6]/10 text-[#7D53F6] px-4 py-2 rounded-2xl font-bold text-xs transition-all duration-150 cursor-pointer focus:outline-none"
          >
            <Edit3 size={13} />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
          {pData.personal.fields.map((field, idx) => {
            const FieldIcon = field.icon;
            return (
              <div key={idx} className="flex items-start gap-4 p-3 bg-slate-50/40 hover:bg-slate-50 rounded-2xl border border-slate-100/50 transition-colors group">
                <div className="p-2 bg-white text-slate-400 group-hover:text-[#7D53F6] rounded-xl border border-slate-100 shadow-sm flex-shrink-0 transition-colors">
                  <FieldIcon size={16} />
                </div>
                <div className="truncate text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                    {field.label}
                  </span>
                  <span className="font-black text-slate-700 text-sm truncate block mt-1.5 leading-none">
                    {field.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Academic Information Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-slate-100 shadow-xl shadow-slate-100/30 p-6 sm:p-8 space-y-6 hover:shadow-2xl hover:border-slate-200/80 transition-all duration-300">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="p-2.5 bg-[#7D53F6]/10 text-[#7D53F6] rounded-2xl shadow-sm">
            <BookOpen size={18} className="stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase leading-tight">
              {pData.academic.title}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 leading-none">
              Enrollment Mappings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
          {pData.academic.fields.map((field, idx) => {
            const FieldIcon = field.icon;
            return (
              <div key={idx} className="flex flex-col gap-3 p-4 bg-slate-50/40 hover:bg-slate-50 border border-slate-100/50 rounded-2xl transition-colors group text-left">
                <div className="p-2 bg-white text-slate-400 group-hover:text-[#7D53F6] border border-slate-100 shadow-sm rounded-xl w-fit flex-shrink-0 transition-colors">
                  <FieldIcon size={14} />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                    {field.label}
                  </span>
                  <span className="font-black text-slate-700 text-xs sm:text-sm truncate block mt-2.5 leading-none">
                    {field.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Other Information Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-slate-100 shadow-xl shadow-slate-100/30 p-6 sm:p-8 space-y-6 hover:shadow-2xl hover:border-slate-200/80 transition-all duration-300">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="p-2.5 bg-[#7D53F6]/10 text-[#7D53F6] rounded-2xl shadow-sm">
            <Info size={18} className="stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase leading-tight">
              {pData.other.title}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 leading-none">
              Institutional Supervision
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {pData.other.fields.map((field, idx) => {
            const FieldIcon = field.icon;
            return (
              <div key={idx} className="flex items-start gap-4 p-3 bg-slate-50/40 hover:bg-slate-50 border border-slate-100/50 rounded-2xl transition-colors group">
                <div className="p-2 bg-white text-slate-400 group-hover:text-[#7D53F6] rounded-xl border border-slate-100 shadow-sm flex-shrink-0 transition-colors">
                  <FieldIcon size={16} />
                </div>
                <div className="truncate text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                    {field.label}
                  </span>
                  <span className="font-black text-slate-700 text-sm truncate block mt-1.5 leading-none">
                    {field.value}
                  </span>
                </div>
              </div>
            );
          })}
          
          <div className="flex items-start gap-4 p-3 bg-slate-50/40 hover:bg-slate-50 border border-slate-100/50 rounded-2xl transition-colors group">
            <div className="p-2 bg-white text-slate-400 group-hover:text-emerald-500 rounded-xl border border-slate-100 shadow-sm flex-shrink-0 transition-colors">
              <ShieldCheck size={16} />
            </div>
            <div className="text-left space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                Account Status
              </span>
              <div className="flex items-center pt-0.5 leading-none">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span>Active</span>
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
