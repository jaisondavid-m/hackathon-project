import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Percent, CheckCircle, XCircle } from 'lucide-react';
import HistoryLogs from './HistoryLogs';

function StudentHistory() {
  const { records } = useOutletContext();

  // Get all unique dates from the records list
  const uniqueDates = Array.from(new Set(records.map(r => r.date)));

  // Generate full records including absent ones
  const fullRecords = [...records];

  uniqueDates.forEach(date => {
    // Get all hours that the student has logs for on this date
    const loggedHours = records
      .filter(r => r.date === date)
      .map(r => r.hour_number);

    // Check hours 1 to 7
    for (let h = 1; h <= 7; h++) {
      if (!loggedHours.includes(h)) {
        // Student was absent for this hour on this date
        fullRecords.push({
          id: `absent-${date}-${h}`,
          student_id: records[0]?.student_id || 0,
          class_id: `Hour-${h}`,
          hour_number: h,
          date: date,
          status: 'absent',
          created_at: `${date}T00:00:00Z` // mock creation date
        });
      }
    }
  });

  // Calculate statistics based on full records (including dynamic absent ones)
  const total = fullRecords.length;
  const presentCount = fullRecords.filter(r => r.status === 'present' || r.status === 'late').length;
  const absentCount = fullRecords.filter(r => r.status === 'absent').length;
  const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const getPercentageColor = (pct) => {
    if (pct >= 85) return 'text-emerald-600';
    if (pct >= 75) return 'text-[#7D53F6]';
    return 'text-rose-500';
  };

  const getPercentageIconStyle = (pct) => {
    if (pct >= 85) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (pct >= 75) return 'bg-[#7D53F6]/5 text-[#7D53F6] border-[#7D53F6]/10';
    return 'bg-rose-50 text-rose-500 border-rose-100';
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Percentage */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
            <span className={`text-3xl font-black ${getPercentageColor(percentage)} block mt-1`}>
              {percentage}%
            </span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getPercentageIconStyle(percentage)} flex-shrink-0`}>
            <Percent size={20} />
          </div>
        </div>

        {/* Present Count */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Present Sessions</span>
            <span className="text-3xl font-black text-slate-800 block mt-1">
              {presentCount} <span className="text-xs font-bold text-slate-400">sessions</span>
            </span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center border border-emerald-100 flex-shrink-0">
            <CheckCircle size={20} />
          </div>
        </div>

        {/* Absent Count */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Absent Sessions</span>
            <span className="text-3xl font-black text-rose-600 block mt-1">
              {absentCount} <span className="text-xs font-bold text-slate-400">sessions</span>
            </span>
          </div>
          <div className="bg-rose-50 text-rose-600 w-12 h-12 rounded-xl flex items-center justify-center border border-rose-100 flex-shrink-0">
            <XCircle size={20} />
          </div>
        </div>
      </div>

      {/* History Logs */}
      <HistoryLogs records={fullRecords} />
    </div>
  );
}

export default StudentHistory;
