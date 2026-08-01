import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

function FacultyTimeTable() {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  const periods = [
    { num: 1, time: '09:00 AM - 10:00 AM' },
    { num: 2, time: '10:00 AM - 11:00 AM' },
    { num: 3, time: '11:00 AM - 12:00 PM' },
    { num: 4, time: '12:00 PM - 01:00 PM' },
    { num: 5, time: '02:00 PM - 03:00 PM' },
    { num: 6, time: '03:00 PM - 04:00 PM' },
    { num: 7, time: '04:00 PM - 05:00 PM' },
  ];

  // Dummy timetable grid mapping [Day][Period] - Styled uniformly using Brand Purple
  const timetableData = {
    Monday: {
      1: { subject: 'Computer Networks', code: 'CS-302', venue: 'EW 225' },
      2: { subject: 'Operating Systems', code: 'CS-304', venue: 'EW 224' },
      3: null, // Free
      4: { subject: 'Database Management', code: 'CS-306', venue: 'IT Lab 2' },
      5: { subject: 'Compiler Design', code: 'CS-308', venue: 'EW 223' },
      6: null,
      7: null,
    },
    Tuesday: {
      1: null,
      2: { subject: 'Database Management', code: 'CS-306', venue: 'IT Lab 2' },
      3: { subject: 'Computer Networks', code: 'CS-302', venue: 'EW 225' },
      4: null,
      5: { subject: 'Software Engineering', code: 'CS-310', venue: 'SF-101' },
      6: { subject: 'Operating Systems', code: 'CS-304', venue: 'EW 224' },
      7: null,
    },
    Wednesday: {
      1: { subject: 'Compiler Design', code: 'CS-308', venue: 'EW 223' },
      2: null,
      3: { subject: 'Software Engineering', code: 'CS-310', venue: 'SF-101' },
      4: { subject: 'Computer Networks', code: 'CS-302', venue: 'EW 225' },
      5: null,
      6: null,
      7: null,
    },
    Thursday: {
      1: { subject: 'Operating Systems', code: 'CS-304', venue: 'EW 224' },
      2: { subject: 'Compiler Design', code: 'CS-308', venue: 'EW 223' },
      3: null,
      4: null,
      5: { subject: 'Database Management', code: 'CS-306', venue: 'IT Lab2' },
      6: null,
      7: null,
    },
    Friday: {
      1: null,
      2: null,
      3: { subject: 'Software Engineering', code: 'CS-310', venue: 'SF-101' },
      4: { subject: 'Computer Networks', code: 'CS-302', venue: 'EW 225' },
      5: { subject: 'Compiler Design', code: 'CS-308', venue: 'EW 223' },
      6: { subject: 'Database Management', code: 'CS-306', venue: 'IT Lab2' },
      7: null,
    },
  };

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 flex-shrink-0">
        <div className="p-2 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl animate-fadeIn">
          <Calendar size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Faculty Schedule & Timetable</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Review your weekly lecture allocation and classroom assignments
          </p>
        </div>
      </div>

      {/* Grid container */}
      <div className="overflow-x-auto border border-slate-100 rounded-3xl bg-white shadow-sm">
        <table className="w-full text-center border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400">
              <th className="p-4 pl-6 text-left text-[10px] font-bold uppercase tracking-widest w-28 select-none">
                Weekday
              </th>
              {periods.map((p) => (
                <th key={p.num} className="p-3 border-l border-slate-100/80">
                  <div className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                    Period {p.num}
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono mt-0.5 font-bold uppercase select-none">
                    {p.time}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {weekdays.map((day) => (
              <tr key={day} className="hover:bg-slate-50/20 transition-colors">
                {/* Day Row Label */}
                <td className="p-4 pl-6 text-left font-black text-xs text-slate-700 w-28 select-none">
                  {day}
                </td>

                {/* Period Slots */}
                {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                  const slot = timetableData[day][num];
                  if (slot) {
                    return (
                      <td key={num} className="p-2.5 border-l border-slate-100/80">
                        <div className="p-2.5 rounded-2xl border text-left space-y-1.5 transition-all duration-200 hover:scale-[1.02] shadow-sm bg-[#7D53F6]/5 text-[#7D53F6] border-[#7D53F6]/10 hover:bg-[#7D53F6]/10">
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-black text-[10px] tracking-tight leading-tight block">
                              {slot.subject}
                            </span>
                            <span className="text-[8px] font-mono font-bold leading-none bg-white border border-[#7D53F6]/10 px-1 py-0.5 rounded uppercase">
                              {slot.code}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] font-extrabold opacity-80 leading-none">
                            <MapPin size={10} className="stroke-[2.5]" />
                            <span>{slot.venue}</span>
                          </div>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={num} className="p-2.5 border-l border-slate-100/80 select-none">
                      <div className="py-6 text-[9px] text-slate-300 font-extrabold uppercase tracking-widest">
                        Free
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FacultyTimeTable;
