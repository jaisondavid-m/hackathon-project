import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { User, Mail, BookOpen, GraduationCap, Award } from 'lucide-react';

function StudentProfile() {
  const { user } = useOutletContext();

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <div className="p-3 bg-[#7D53F6]/10 text-[#7D53F6] rounded-2xl">
          <User size={24} className="stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Profile</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">
            Student Identification & Information
          </p>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white rounded-[32px] border border-slate-100/80 shadow-xl overflow-hidden">
        {/* Header decoration */}
        <div className="h-32 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] relative flex items-end p-6">
          <div className="absolute top-4 right-4 text-white/10">
            <Award size={100} />
          </div>
          <div className="flex items-center gap-4 translate-y-10">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-lg border-4 border-white flex items-center justify-center text-slate-800 text-2xl font-black">
              J
            </div>
          </div>
        </div>

        <div className="pt-14 p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Full Name */}
            <div className="p-5 bg-slate-50/50 border border-slate-100/50 rounded-2xl flex items-start gap-4">
              <div className="p-2.5 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl flex-shrink-0">
                <User size={20} />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Full Name</span>
                <span className="font-extrabold text-slate-800 text-base truncate block mt-1">
                  JAISON DEVID M
                </span>
              </div>
            </div>

            {/* Register Number */}
            <div className="p-5 bg-slate-50/50 border border-slate-100/50 rounded-2xl flex items-start gap-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl flex-shrink-0">
                <GraduationCap size={20} />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Register Number</span>
                <span className="font-extrabold text-slate-800 text-base truncate block mt-1">
                  2023CSE0{user?.id || 12}
                </span>
              </div>
            </div>

            {/* Department */}
            <div className="p-5 bg-slate-50/50 border border-slate-100/50 rounded-2xl flex items-start gap-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl flex-shrink-0">
                <BookOpen size={20} />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Department</span>
                <span className="font-extrabold text-slate-800 text-base truncate block mt-1">
                  Computer Science & Engineering
                </span>
              </div>
            </div>

            {/* Year of Study */}
            <div className="p-5 bg-slate-50/50 border border-slate-100/50 rounded-2xl flex items-start gap-4">
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

            {/* Email Address */}
            <div className="p-5 bg-slate-50/50 border border-slate-100/50 rounded-2xl flex items-start gap-4 md:col-span-2">
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
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;
