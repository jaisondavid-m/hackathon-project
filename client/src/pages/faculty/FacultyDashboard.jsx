import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ClipboardList, Users } from 'lucide-react';

function FacultyDashboard() {
  const [selectedClass, setSelectedClass] = useState('CS101');

  const classes = [
    { id: 'CS101', name: 'Computer Science (CS-A)', time: '09:00 AM - 10:00 AM', count: 5 },
    { id: 'CS202', name: 'Data Structures (CS-B)', time: '11:30 AM - 12:30 PM', count: 4 },
    { id: 'CS305', name: 'Web Engineering', time: '02:00 PM - 03:00 PM', count: 5 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left column: Class schedule list */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#F8FAFC] rounded-3xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-[#7D53F6]" />
            Schedule List
          </h2>
          <div className="space-y-3">
            {classes.map((c) => {
              const isActive = selectedClass === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClass(c.id)}
                  className={`w-full text-left p-4 border rounded-2xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'border-[#7D53F6] bg-[#7D53F6]/5 ring-1 ring-slate-100 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-semibold text-sm ${isActive ? 'text-[#7D53F6]' : 'text-slate-700'}`}>
                      {c.name}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase">
                      {c.id}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs font-semibold tracking-wide">
                    {c.time}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Users size={14} />
                    <span>{c.count} students enrolled</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right column: Action views */}
      <div className="lg:col-span-8">
        <Outlet context={{ selectedClass, classes }} />
      </div>
    </div>
  );
}

export default FacultyDashboard;
