import React from 'react';
import { Percent, CheckCircle } from 'lucide-react';

function StudentStats({ stats }) {
  // Denominator (total classes scheduled in the semester)
  const totalClassesScheduled = 38;
  const classesAttended = stats.total; // Present + Late
  const overallPercentage = totalClassesScheduled > 0 
    ? Math.min(100, Math.round((classesAttended / totalClassesScheduled) * 1000) / 10) 
    : 0;

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Overall Percentage Card */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 flex items-center justify-between col-span-1 md:col-span-2">
        <div className="space-y-2 flex-grow pr-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Overall Attendance</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black ${getPercentageColor(overallPercentage)}`}>
              {overallPercentage}%
            </span>
            <span className="text-xs font-bold text-slate-400">Target: 75% min</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getPercentageBg(overallPercentage)}`}
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>
        <div className="bg-[#7D53F6]/5 text-[#7D53F6] w-14 h-14 rounded-2xl flex items-center justify-center border border-[#7D53F6]/10 flex-shrink-0">
          <Percent size={28} />
        </div>
      </div>

      {/* Classes Count Card */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Attended Sessions</span>
          <span className="text-3xl font-black text-slate-800 block">
            {classesAttended} <span className="text-sm font-semibold text-slate-400">/ {totalClassesScheduled}</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
            Semester Standing
          </span>
        </div>
        <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center border border-emerald-100">
          <CheckCircle size={22} />
        </div>
      </div>
    </div>
  );
}

export default StudentStats;
