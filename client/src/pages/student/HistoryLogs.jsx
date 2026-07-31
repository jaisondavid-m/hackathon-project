import React from 'react';
import { CalendarDays, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

function HistoryLogs({ records }) {
  const subjectMap = {
    CS101: { name: 'Computer Science' },
    CS202: { name: 'Data Structures' },
    CS305: { name: 'Web Engineering' },
    MTH201: { name: 'Discrete Mathematics' },
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return (
          <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <CheckCircle size={12} /> Present
          </span>
        );
      case 'late':
        return (
          <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
            <Clock size={12} /> Late
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
            <XCircle size={12} /> Absent
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
        <CalendarDays size={18} className="text-[#7D53F6]" />
        History Logs
      </h2>

      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
        {records.length > 0 ? (
          records.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 border border-slate-100/50 rounded-2xl transition-colors duration-150"
            >
              <div className="space-y-1 truncate pr-3">
                <h4 className="font-semibold text-slate-700 text-sm leading-none truncate">
                  {subjectMap[item.class_id]?.name || item.class_id}
                </h4>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">
                  {item.date} &bull; Hour {item.hour_number}
                </span>
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
