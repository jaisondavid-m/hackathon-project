import React, { useState } from 'react';
import { Search, CheckCircle, AlertCircle, UserCheck } from 'lucide-react';

import { useOutletContext } from 'react-router-dom';

function ManualAttendance() {
  const { selectedClass, classes } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState('');

  // Manual list fallback states
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

  // Manual fallback handlers
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
    const className = classes.find(c => c.id === selectedClass)?.name || '';
    setSuccess(`Attendance for ${className} submitted successfully!`);
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
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 sm:p-8 animate-fadeIn">
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
  );
}

export default ManualAttendance;
