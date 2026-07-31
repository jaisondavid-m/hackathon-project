import React from 'react';
import { Percent, Clock, CalendarDays, CheckCircle, AlertTriangle, XCircle, ArrowUpRight } from 'lucide-react';

function StudentDashboard({ user }) {
  // Mock data for student details
  const attendanceSummary = {
    overallPercentage: 86.8,
    attended: 33,
    total: 38,
    absent: 4,
    late: 1,
  };

  const subjectAttendance = [
    { code: 'CS101', name: 'Computer Science', attended: 9, total: 10, percentage: 90, status: 'excellent' },
    { code: 'CS202', name: 'Data Structures', attended: 8, total: 10, percentage: 80, status: 'good' },
    { code: 'CS305', name: 'Web Engineering', attended: 10, total: 10, percentage: 100, status: 'excellent' },
    { code: 'MTH201', name: 'Discrete Mathematics', attended: 6, total: 8, percentage: 75, status: 'warning' },
  ];

  const recentHistory = [
    { date: 'July 31, 2026', subject: 'Computer Science', time: '09:00 AM', status: 'present' },
    { date: 'July 30, 2026', subject: 'Discrete Mathematics', time: '10:15 AM', status: 'present' },
    { date: 'July 29, 2026', subject: 'Data Structures', time: '11:30 AM', status: 'late' },
    { date: 'July 28, 2026', subject: 'Web Engineering', time: '02:00 PM', status: 'present' },
    { date: 'July 27, 2026', subject: 'Discrete Mathematics', time: '10:15 AM', status: 'absent' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <CheckCircle size={12} /> Present
          </span>
        );
      case 'late':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
            <Clock size={12} /> Late
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
            <XCircle size={12} /> Absent
          </span>
        );
    }
  };

  const getPercentageColor = (pct) => {
    if (pct >= 85) return 'text-emerald-600';
    if (pct >= 75) return 'text-[#7D53F6]';
    return 'text-rose-500';
  };

  const getPercentageBg = (pct) => {
    if (pct >= 85) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-[#7D53F6]';
    return 'bg-rose-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Student Dashboard</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1.5 font-medium">
          Welcome back! Review your class attendance percentages and log records.
        </p>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Overall Percentage Card */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 flex items-center justify-between col-span-1 md:col-span-2">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Overall Attendance</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black ${getPercentageColor(attendanceSummary.overallPercentage)}`}>
                {attendanceSummary.overallPercentage}%
              </span>
              <span className="text-xs font-bold text-slate-400">Target: 75% min</span>
            </div>
            {/* Visual Progress bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getPercentageBg(attendanceSummary.overallPercentage)}`}
                style={{ width: `${attendanceSummary.overallPercentage}%` }}
              />
            </div>
          </div>
          <div className="bg-[#7D53F6]/5 text-[#7D53F6] w-14 h-14 rounded-2xl flex items-center justify-center border border-[#7D53F6]/10">
            <Percent size={28} />
          </div>
        </div>

        {/* Classes Count Card */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Classes Attended</span>
            <span className="text-3xl font-black text-slate-800 block">
              {attendanceSummary.attended} <span className="text-sm font-semibold text-slate-400">/ {attendanceSummary.total}</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
              Classes Logged
            </span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center border border-emerald-100">
            <CheckCircle size={22} />
          </div>
        </div>

        {/* Absences Card */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Absences Logged</span>
            <span className="text-3xl font-black text-rose-500 block">
              {attendanceSummary.absent} <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">days</span>
            </span>
            {attendanceSummary.overallPercentage < 75 ? (
              <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-1 uppercase">
                <AlertTriangle size={12} /> Critically Low
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-1 uppercase">
                <CheckCircle size={12} /> Safe Standings
              </span>
            )}
          </div>
          <div className="bg-rose-50 text-rose-500 w-12 h-12 rounded-xl flex items-center justify-center border border-rose-100">
            <XCircle size={22} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Subject-Wise Report */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
              <Percent size={18} className="text-[#7D53F6]" />
              Subject-Wise Attendance Breakdown
            </h2>

            <div className="space-y-6">
              {subjectAttendance.map((sub) => {
                const isAlert = sub.percentage < 75;
                return (
                  <div key={sub.code} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-semibold text-slate-700 block">
                          {sub.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                          Code: {sub.code}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-black ${getPercentageColor(sub.percentage)} text-base block`}>
                          {sub.percentage}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          {sub.attended} / {sub.total} sessions
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getPercentageBg(sub.percentage)}`}
                        style={{ width: `${sub.percentage}%` }}
                      />
                    </div>
                    {isAlert && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-500 font-bold uppercase tracking-wider">
                        <AlertTriangle size={12} />
                        <span>Warning: Attendance below mandatory 75% threshold</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Attendance Logs */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
              <CalendarDays size={18} className="text-[#7D53F6]" />
              Recent Logs
            </h2>

            <div className="space-y-4">
              {recentHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 border border-slate-100/50 rounded-2xl transition-colors duration-150"
                >
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-700 text-sm leading-none">
                      {item.subject}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      {item.date} &bull; {item.time}
                    </span>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
