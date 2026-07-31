import React from 'react';
import { Percent, AlertTriangle } from 'lucide-react';

function SubjectBreakdown({ records }) {
  // Group database records by subject code to calculate subject percentages
  const subjectMap = {
    CS101: { name: 'Computer Science', code: 'CS101', attended: 0, total: 10 },
    CS202: { name: 'Data Structures', code: 'CS202', attended: 0, total: 10 },
    CS305: { name: 'Web Engineering', code: 'CS305', attended: 0, total: 10 },
    MTH201: { name: 'Discrete Mathematics', code: 'MTH201', attended: 0, total: 8 },
  };

  // Compute subject attendance based on real DB records
  records.forEach((rec) => {
    if (subjectMap[rec.class_id]) {
      subjectMap[rec.class_id].attended++;
    }
  });

  const subjectAttendance = Object.values(subjectMap).map((sub) => {
    const percentage = Math.round((sub.attended / sub.total) * 100);
    return {
      ...sub,
      percentage,
      status: percentage >= 85 ? 'excellent' : percentage >= 75 ? 'good' : 'warning',
    };
  });

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
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 sm:p-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
        <Percent size={18} className="text-[#7D53F6]" />
        Subject Breakdown
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
  );
}

export default SubjectBreakdown;
