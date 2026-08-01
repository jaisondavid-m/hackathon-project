import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Percent, CheckCircle, XCircle } from 'lucide-react';
import HistoryLogs from './HistoryLogs';

function StudentHistory() {
  const { records } = useOutletContext();

  // Get all unique dates from the records list (sorted descending: latest first)
  const uniqueDates = Array.from(new Set(records.map(r => r.date))).sort((a, b) => b.localeCompare(a));

  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (uniqueDates.length > 0 && !selectedDate) {
      setSelectedDate(uniqueDates[0]);
    }
  }, [uniqueDates, selectedDate]);

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

  // Filter fullRecords for the selectedDate
  const dailyRecords = selectedDate ? fullRecords.filter(r => r.date === selectedDate) : [];

  // Calculate statistics based on dailyRecords (selected date's attendance)
  const total = dailyRecords.length;
  const presentCount = dailyRecords.filter(r => r.status === 'present' || r.status === 'late').length;
  const absentCount = dailyRecords.filter(r => r.status === 'absent').length;
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
      {/* Date Selector Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-100/80 shadow-md p-6">
        <div>
          <h2 className="text-base font-bold text-slate-800 leading-none">Select Attendance Date</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 leading-none">
            Filter attendance records and daily statistics by date
          </p>
        </div>
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl focus:outline-none focus:border-[#7D53F6] focus:ring-4 focus:ring-[#7D53F6]/10 transition-all duration-200 cursor-pointer"
          />
        </div>
      </div>

      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Percentage */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Daily Attendance Rate</span>
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
      <HistoryLogs records={dailyRecords} />
    </div>
  );
}

export default StudentHistory;
