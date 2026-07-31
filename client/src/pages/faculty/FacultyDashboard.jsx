import React, { useState } from 'react';
import { Calendar, Key, Layers, ClipboardList, Users } from 'lucide-react';
import OTPGeneration from './OTPGeneration';
import ManualAttendance from './ManualAttendance';

function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState('otp'); // 'otp' or 'manual'
  const [selectedClass, setSelectedClass] = useState('CS101');

  const classes = [
    { id: 'CS101', name: 'Computer Science (CS-A)', time: '09:00 AM - 10:00 AM', count: 5 },
    { id: 'CS202', name: 'Data Structures (CS-B)', time: '11:30 AM - 12:30 PM', count: 4 },
    { id: 'CS305', name: 'Web Engineering', time: '02:00 PM - 03:00 PM', count: 5 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Faculty Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium flex items-center gap-2">
            <Calendar size={16} className="text-[#7D53F6]" />
            Manage attendance sheets or start an OTP session.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#EEF1F9] p-1.5 rounded-2xl border border-slate-100/50">
          <button
            onClick={() => setActiveTab('otp')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold tracking-wider uppercase rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === 'otp'
                ? 'bg-white text-[#7D53F6] shadow-sm'
                : 'text-slate-500 hover:text-[#7D53F6]'
            }`}
          >
            <Key size={14} />
            <span>OTP & QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold tracking-wider uppercase rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white text-[#7D53F6] shadow-sm'
                : 'text-slate-500 hover:text-[#7D53F6]'
            }`}
          >
            <Layers size={14} />
            <span>Manual Sheet</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Class schedule list */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6">
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
          {activeTab === 'otp' && (
            <OTPGeneration selectedClass={selectedClass} classes={classes} />
          )}
          {activeTab === 'manual' && (
            <ManualAttendance selectedClass={selectedClass} classes={classes} />
          )}
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;
