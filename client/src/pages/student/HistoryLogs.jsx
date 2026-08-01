import React from 'react';
import { CalendarDays, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

function HistoryLogs({ records }) {
  // Mapping of hour numbers to unique subject names to vary them
  const getSubjectNameByHour = (hourNumber, classId) => {
    const defaultSubjects = {
      1: 'Computer Science',
      2: 'Data Structures',
      3: 'Web Engineering',
      4: 'Discrete Mathematics',
      5: 'Operating Systems',
      6: 'Computer Networks',
      7: 'Database Systems'
    };
    return defaultSubjects[hourNumber] || classId;
  };

  const getHourTimeLabel = (hourNumber) => {
    const timeLabels = {
      1: '8:45 AM to 9:35 AM',
      2: '9:35 AM to 10:25 AM',
      3: '10:45 AM to 11:35 AM',
      4: '11:35 AM to 12:25 PM',
      5: '1:30 PM to 2:20 PM',
      6: '2:20 PM to 3:10 PM',
      7: '3:10 PM to 4:00 PM'
    };
    return timeLabels[hourNumber] || '';
  };

  const getMarkedByLabel = (hourNumber, status) => {
    if (status === 'absent') {
      return 'System Auto-Absence';
    }
    // Professional and varied simulation of marking methods
    switch (hourNumber) {
      case 1:
      case 5:
        return 'Student (OTP Verification)';
      case 2:
      case 6:
        return 'Student (QR Scan)';
      case 3:
        return 'Biometric Fingerprint';
      default:
        return 'Faculty Portal (Manual)';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return (
          <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex-shrink-0">
            <CheckCircle size={12} /> Present
          </span>
        );
      case 'late':
        return (
          <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex-shrink-0">
            <Clock size={12} /> Late
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 flex-shrink-0">
            <XCircle size={12} /> Absent
          </span>
        );
    }
  };

  // Sort logs by Date descending (latest first) and then by Hour ascending (1 to 7)
  const sortedRecords = [...records].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return a.hour_number - b.hour_number;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
        <CalendarDays size={18} className="text-[#7D53F6]" />
        History Logs
      </h2>

      <div className="space-y-3">
        {sortedRecords.length > 0 ? (
          sortedRecords.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 border border-slate-100/50 rounded-2xl transition-colors duration-150"
            >
              <div className="space-y-1 truncate pr-3 flex-grow">
                <h4 className="font-semibold text-slate-700 text-sm leading-none truncate">
                  {getSubjectNameByHour(item.hour_number, item.class_id)}
                </h4>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 font-bold mt-1.5 leading-none">
                  <span className="text-[#7D53F6] font-extrabold">
                    Hour {item.hour_number} - {getHourTimeLabel(item.hour_number)}
                  </span>
                  <span>&bull;</span>
                  <span className="text-slate-500">
                    Marked by: <span className="font-extrabold text-slate-600">{getMarkedByLabel(item.hour_number, item.status)}</span>
                  </span>
                </div>
              </div>
              {getStatusBadge(item.status)}
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle size={20} className="mx-auto mb-2 text-slate-300" />
            <span>No attendance logs found</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryLogs;
