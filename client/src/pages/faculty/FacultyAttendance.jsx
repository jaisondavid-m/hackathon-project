import React from 'react';
import { UserCheck, Clock, AlertCircle, Calendar, ShieldCheck, CheckCircle } from 'lucide-react';

function FacultyAttendance() {
  // Dummy data representing faculty attendance metrics
  const totalSlots = 40;
  const presentSlots = 38;
  const lateSlots = 2;
  const attendancePercentage = ((presentSlots / totalSlots) * 100).toFixed(1);

  // Buffer timing details
  const totalBufferAllowance = 30; // in minutes (Updated to 30 mins)
  const usedBuffer = 10; // in minutes (5 mins late * 2 slots)
  const remainingBuffer = totalBufferAllowance - usedBuffer;
  const bufferPercent = ((remainingBuffer / totalBufferAllowance) * 100).toFixed(0);

  // Recent attendance logs updated to reflect fingerprint biometric windows
  const logs = [
    { date: '2026-07-31', period: 'Morning Biometric (08:00 AM)', checkin: '08:00 AM', status: 'Present', offset: 'On Time', offsetType: 'ontime' },
    { date: '2026-07-31', period: 'Afternoon Biometric (12:50 PM)', checkin: '12:55 PM', status: 'Late (Buffer Used)', offset: '+5 mins', offsetType: 'late' },
    { date: '2026-07-30', period: 'Morning Biometric (08:00 AM)', checkin: '08:05 AM', status: 'Late (Buffer Used)', offset: '+5 mins', offsetType: 'late' },
    { date: '2026-07-30', period: 'Afternoon Biometric (12:50 PM)', checkin: '12:50 PM', status: 'Present', offset: 'On Time', offsetType: 'ontime' },
    { date: '2026-07-29', period: 'Morning Biometric (08:00 AM)', checkin: '08:00 AM', status: 'Present', offset: 'On Time', offsetType: 'ontime' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 flex-shrink-0">
        <div className="p-2 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl">
          <UserCheck size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Attendance</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Monitor your overall attendance percentages and check-in buffer timing allowances
          </p>
        </div>
      </div>



      {/* Metrics Row Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Attendance Percentage Card */}
        <div className="md:col-span-6 bg-white border border-slate-100/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Cumulative Percentage
            </span>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">
              {attendancePercentage}%
            </h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-[220px]">
              You have completed <strong className="text-slate-700">{presentSlots} out of {totalSlots}</strong> assigned biometric slots successfully.
            </p>
          </div>
          
          {/* Circular progress visualizer */}
          <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="38"
                className="stroke-slate-100"
                strokeWidth="7.5"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="38"
                className="stroke-[#7D53F6]"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 38}`}
                strokeDashoffset={`${2 * Math.PI * 38 * (1 - attendancePercentage / 100)}`}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute font-black text-sm text-[#7D53F6]">
              {attendancePercentage}%
            </div>
          </div>
        </div>

        {/* Buffer Time Status Card */}
        <div className="md:col-span-6 bg-white border border-slate-100/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-5">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Monthly Buffer Limit
              </span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-baseline gap-1.5">
                <span>{remainingBuffer} mins</span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">left</span>
              </h3>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={18} />
            </div>
          </div>

          {/* Buffer limit status progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              <span>Used: {usedBuffer} mins</span>
              <span>Total Allowance: {totalBufferAllowance} mins</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${bufferPercent}%` }}
              />
            </div>
            <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-relaxed flex items-center gap-1 mt-1">
              <AlertCircle size={11} className="text-amber-500" />
              <span>Buffer is consumed when checking in late (after 08:00 AM or 12:50 PM).</span>
            </div>
          </div>
        </div>

      </div>

      {/* Logs Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2 select-none">
          <ShieldCheck size={16} className="text-[#7D53F6]" />
          Recent Biometric Session Logs
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="pb-3 pl-3">Date</th>
                <th className="pb-3">Check-In Category</th>
                <th className="pb-3">Biometric Check-in Time</th>
                <th className="pb-3">Time Offset</th>
                <th className="pb-3 pr-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {logs.map((l, idx) => (
                <tr key={idx} className="hover:bg-slate-50/20 transition-colors">
                  <td className="py-3 pl-3 text-slate-500 font-medium">
                    {l.date}
                  </td>
                  <td className="py-3 font-bold text-slate-800">
                    {l.period}
                  </td>
                  <td className="py-3 font-mono text-[11px] text-slate-600">
                    {l.checkin}
                  </td>
                  <td className="py-3">
                    {l.offsetType === 'late' ? (
                      <span className="text-rose-600 font-black">{l.offset}</span>
                    ) : l.offsetType === 'ontime' ? (
                      <span className="text-emerald-600 font-black">{l.offset}</span>
                    ) : (
                      <span className="text-slate-500 font-black">{l.offset}</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-center">
                    {l.status.includes('Present') ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase rounded-full border border-emerald-100/50">
                        <CheckCircle size={10} />
                        <span>Present</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-[9px] font-extrabold uppercase rounded-full border border-amber-100/50">
                        <Clock size={10} />
                        <span>Late (Buffer Used)</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FacultyAttendance;
