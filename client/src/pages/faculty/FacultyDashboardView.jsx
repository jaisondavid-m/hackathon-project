import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ArrowRight,
  BookOpen,
  UserCheck,
  Timer,
  Sparkles,
  QrCode
} from 'lucide-react';

function FacultyDashboardView() {
  const { user } = useOutletContext();
  const navigate = useNavigate();

  // Current Date formatting
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Dummy statistics
  const stats = [
    {
      title: "Today's Schedule",
      value: "4 Lectures",
      desc: "2 completed, 2 remaining",
      icon: Calendar,
    },
    {
      title: "Avg. Student Attendance",
      value: "92.4%",
      desc: "+1.2% from last week",
      icon: UserCheck,
    },
    {
      title: "Active Session",
      value: "Active",
      desc: "Hour 2 OTP is live",
      icon: Timer,
    }
  ];

  // Dummy data for upcoming classes today
  const todaysClasses = [
    {
      hour: 1,
      subject: 'Computer Networks',
      code: 'CS-302',
      time: '09:00 AM - 10:00 AM',
      venue: 'EW 225',
      status: 'Completed',
      attendance: '96%'
    },
    {
      hour: 2,
      subject: 'Operating Systems',
      code: 'CS-304',
      time: '10:00 AM - 11:00 AM',
      venue: 'EW 224',
      status: 'In Progress',
      attendance: '91%'
    },
    {
      hour: 3,
      subject: 'Database Management',
      code: 'CS-306',
      time: '11:00 AM - 12:00 PM',
      venue: 'IT Lab 2',
      status: 'Next Up',
      attendance: '-'
    },
    {
      hour: 5,
      subject: 'Compiler Design',
      code: 'CS-308',
      time: '02:00 PM - 03:00 PM',
      venue: 'EW 223',
      status: 'Scheduled',
      attendance: '-'
    }
  ];

  // Dummy mapped students for the active class (Hour 2 - Operating Systems)
  const mappedStudents = [
    { name: 'Jaison David', registerNo: '7376222CS125', subject: 'Operating Systems', status: 'Present', time: '10:03 AM', method: 'OTP Code' },
    { name: 'Sanjay Kumar', registerNo: '7376222CS214', subject: 'Operating Systems', status: 'Present', time: '10:01 AM', method: 'QR Scan' },
    { name: 'Divya K', registerNo: '7376222CS118', subject: 'Operating Systems', status: 'Present', time: '10:05 AM', method: 'OTP Code' },
    { name: 'Abishek R', registerNo: '7376222CS103', subject: 'Operating Systems', status: 'Pending', time: '-', method: '-' },
    { name: 'Priya S', registerNo: '7376222CS201', subject: 'Operating Systems', status: 'Absent', time: '-', method: '-' }
  ];

  return (
    <div className="space-y-6 flex-grow flex flex-col">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl border border-slate-200/60 p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-300 group"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{s.title}</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight block">{s.value}</span>
                <span className="text-[10px] font-semibold text-slate-500 block">{s.desc}</span>
              </div>
              <div className="p-3 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl group-hover:scale-105 transition-transform duration-300">
                <Icon size={20} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        
        {/* Left Side: Live Student List */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-sm flex-grow flex flex-col min-h-[380px]">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  Live Attendance Check
                </h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Hour 2: Operating Systems (CS-304) &bull; EW 224
                </p>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] text-emerald-700 font-extrabold uppercase tracking-wide">
                <Users size={12} />
                <span>3/5 Present</span>
              </div>
            </div>

            {/* Mapped Student List */}
            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-left border-collapse min-w-[450px]">
                <thead>
                  <tr className="text-slate-400 text-[9px] font-bold uppercase tracking-widest border-b border-slate-100 select-none">
                    <th className="pb-2.5 font-bold">Student</th>
                    <th className="pb-2.5 font-bold">Status</th>
                    <th className="pb-2.5 font-bold text-right">Log Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {mappedStudents.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3 pr-2 flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-[#7D53F6]/10 text-[#7D53F6] font-extrabold text-[10px] rounded-lg flex items-center justify-center select-none">
                          {s.name.split(' ').map(p => p[0]).join('')}
                        </div>
                        <div>
                          <span className="font-extrabold text-xs text-slate-700 block leading-tight">{s.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider mt-0.5">{s.registerNo}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 font-extrabold text-[9px] uppercase tracking-wider rounded-md ${
                          s.status === 'Present' 
                            ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                            : s.status === 'Pending' 
                            ? 'bg-amber-50 border border-amber-100 text-amber-700' 
                            : 'bg-rose-50 border border-rose-100 text-rose-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {s.status === 'Present' ? (
                          <div>
                            <span className="text-xs font-bold text-slate-700 block leading-tight">{s.time}</span>
                            <span className="text-[9px] text-[#7D53F6] font-bold uppercase tracking-wider block mt-0.5">{s.method}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Today's Schedule Timeline */}
        <div className="lg:col-span-4 flex">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 sm:p-6 shadow-sm w-full flex flex-col">
            <div className="mb-5 pb-4 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={15} className="text-[#7D53F6]" />
                Today's Schedule
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                Your periods for today
              </p>
            </div>

            {/* Timeline List Wrapper */}
            <div className="flex-grow flex flex-col justify-between py-1 space-y-4">
              {todaysClasses.map((c, idx) => {
                const isCompleted = c.status === 'Completed';
                const isInProgress = c.status === 'In Progress';
                const isNextUp = c.status === 'Next Up';
                
                return (
                  <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-slate-50/20 hover:bg-slate-50/50 border border-slate-100/50 rounded-2xl transition-all duration-200">
                    <div className="flex items-center gap-3">
                      {/* Hour Indicator */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border font-black text-xs select-none ${
                        isCompleted 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                          : isInProgress 
                          ? 'bg-[#7D53F6]/10 border-[#7D53F6]/20 text-[#7D53F6] animate-pulse' 
                          : isNextUp 
                          ? 'bg-amber-50 border-amber-200 text-amber-600' 
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}>
                        H{c.hour}
                      </div>

                      <div className="space-y-0.5">
                        <span className="font-extrabold text-xs text-slate-700 block truncate max-w-[130px] leading-tight">
                          {c.subject}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block leading-none">
                          {c.venue} &bull; {c.time.split(' - ')[0]}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isCompleted 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : isInProgress 
                          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                          : isNextUp 
                          ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200/40'
                      }`}>
                        {isCompleted && c.attendance ? `Att: ${c.attendance}` : c.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default FacultyDashboardView;
