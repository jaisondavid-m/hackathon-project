import React, { useState } from 'react';
import { Calendar, Users, ClipboardList, CheckCircle, Search, UserCheck, AlertCircle } from 'lucide-react';

function FacultyDashboard() {
  const [selectedClass, setSelectedClass] = useState('CS101');
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState('');

  const classes = [
    { id: 'CS101', name: 'Computer Science (CS-A)', time: '09:00 AM - 10:00 AM', count: 5 },
    { id: 'CS202', name: 'Data Structures (CS-B)', time: '11:30 AM - 12:30 PM', count: 4 },
    { id: 'CS305', name: 'Web Engineering', time: '02:00 PM - 03:00 PM', count: 5 },
  ];

  const initialStudents = {
    CS101: [
      { id: 'S101', name: 'Alice Student', status: 'present' },
      { id: 'S102', name: 'Bob Johnson', status: 'present' },
      { id: 'S103', name: 'Charlie Green', status: 'absent' },
      { id: 'S104', name: 'David Miller', status: 'present' },
      { id: 'S105', name: 'Emma Wilson', status: 'late' },
    ],
    CS202: [
      { id: 'S106', name: 'Fiona Gallagher', status: 'present' },
      { id: 'S107', name: 'George Cooper', status: 'absent' },
      { id: 'S108', name: 'Harry Potter', status: 'present' },
      { id: 'S109', name: 'Ian Malcolm', status: 'present' },
    ],
    CS305: [
      { id: 'S101', name: 'Alice Student', status: 'present' },
      { id: 'S103', name: 'Charlie Green', status: 'present' },
      { id: 'S110', name: 'Julia Roberts', status: 'absent' },
      { id: 'S111', name: 'Kevin Bacon', status: 'absent' },
      { id: 'S112', name: 'Liam Neeson', status: 'present' },
    ],
  };

  const [students, setStudents] = useState(initialStudents);

  const handleStatusChange = (studentId, newStatus) => {
    setStudents((prev) => ({
      ...prev,
      [selectedClass]: prev[selectedClass].map((s) =>
        s.id === studentId ? { ...s, status: newStatus } : s
      ),
    }));
    if (success) setSuccess('');
  };

  const handleMarkAll = (status) => {
    setStudents((prev) => ({
      ...prev,
      [selectedClass]: prev[selectedClass].map((s) => ({ ...s, status })),
    }));
    if (success) setSuccess('');
  };

  const handleSubmitAttendance = (e) => {
    e.preventDefault();
    setSuccess(`Attendance for ${classes.find(c => c.id === selectedClass)?.name} submitted successfully!`);
    setTimeout(() => setSuccess(''), 4000);
  };

  // Filter students based on search
  const filteredStudents = (students[selectedClass] || []).filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculation
  const total = students[selectedClass]?.length || 0;
  const present = students[selectedClass]?.filter((s) => s.status === 'present').length || 0;
  const absent = students[selectedClass]?.filter((s) => s.status === 'absent').length || 0;
  const late = students[selectedClass]?.filter((s) => s.status === 'late').length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Faculty Dashboard</h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1.5 font-medium flex items-center gap-2">
            <Calendar size={16} className="text-[#7D53F6]" />
            Manage and log daily classroom attendance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Class lists */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ClipboardList size={18} className="text-[#7D53F6]" />
              Today's Schedule
            </h2>
            <div className="space-y-3">
              {classes.map((c) => {
                const isActive = selectedClass === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedClass(c.id);
                      setSuccess('');
                    }}
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

        {/* Right column: Attendance sheet */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 sm:p-8">
            {/* Stats Header Banner */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-[#EEF1F9]/50 border border-slate-100 rounded-2xl mb-6 text-center">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Enrolled</span>
                <span className="text-xl font-bold text-slate-800 block mt-0.5">{total}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Present</span>
                <span className="text-xl font-bold text-emerald-600 block mt-0.5">{present}</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Late</span>
                <span className="text-xl font-bold text-amber-600 block mt-0.5">{late}</span>
              </div>
              <div>
                <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Absent</span>
                <span className="text-xl font-bold text-rose-600 block mt-0.5">{absent}</span>
              </div>
            </div>

            {/* Attendance Controller bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
              {/* Search bar */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none" size={16} />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all duration-200"
                />
              </div>

              {/* Bulk actions */}
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleMarkAll('present')}
                  className="flex-1 sm:flex-initial text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 border border-emerald-100 rounded-xl cursor-pointer transition-colors"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => handleMarkAll('absent')}
                  className="flex-1 sm:flex-initial text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 border border-rose-100 rounded-xl cursor-pointer transition-colors"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            {/* Success Prompt */}
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm">
                <CheckCircle className="flex-shrink-0" size={18} />
                <span className="font-semibold">{success}</span>
              </div>
            )}

            {/* Students Table */}
            <form onSubmit={handleSubmitAttendance}>
              <div className="overflow-x-auto border border-slate-100 rounded-2xl mb-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Student ID</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 text-right">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <tr
                          key={student.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/20 text-slate-700 font-medium text-sm transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                            {student.id}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {student.name}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-end gap-1.5">
                              {[
                                { id: 'present', label: 'P', activeClass: 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20', idleClass: 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' },
                                { id: 'late', label: 'L', activeClass: 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20', idleClass: 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' },
                                { id: 'absent', label: 'A', activeClass: 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/20', idleClass: 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' },
                              ].map((btn) => {
                                const active = student.status === btn.id;
                                return (
                                  <button
                                    key={btn.id}
                                    type="button"
                                    onClick={() => handleStatusChange(student.id, btn.id)}
                                    className={`w-8 h-8 rounded-lg border text-xs font-extrabold flex items-center justify-center cursor-pointer transition-all duration-150 ${
                                      active ? btn.activeClass : btn.idleClass
                                    }`}
                                  >
                                    {btn.label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 px-4 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <AlertCircle size={20} />
                            <span>No students match the search term.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Submit btn */}
              <button
                type="submit"
                disabled={filteredStudents.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#7D53F6] hover:bg-[#683cdb] text-white font-bold rounded-2xl shadow-lg shadow-[#7D53F6]/20 transition-all duration-200 cursor-pointer disabled:bg-[#7D53F6]/60 disabled:cursor-not-allowed"
              >
                <UserCheck size={18} />
                <span>Submit Attendance Sheet</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;
