import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../api/attendance';
import StudentStats from './StudentStats';
import OTPAttendance from './OTPAttendance';
import SubjectBreakdown from './SubjectBreakdown';
import HistoryLogs from './HistoryLogs';

function StudentDashboard({ user }) {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentAttendance();
  }, []);

  const fetchStudentAttendance = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getStudentRecords();
      setRecords(data.records || []);
      setStats(data.stats || { total: 0, present: 0, late: 0 });
    } catch (err) {
      console.error(err);
      setError('Failed to load attendance history.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && records.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-[#7D53F6]/30 border-t-[#7D53F6] rounded-full animate-spin mx-auto mb-4" />
        <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">
          Loading Attendance Profile...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Student Dashboard</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1.5 font-medium">
          Welcome back, {user?.name || 'Student'}! Enter active OTP codes to log attendance.
        </p>
      </div>

      {/* Top row: Overall Stats & OTP submission card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 items-start">
        {/* Left Column: Overall stats */}
        <div className="lg:col-span-8">
          <StudentStats stats={stats} />
        </div>

        {/* Right Column: OTP Code Entry Widget */}
        <div className="lg:col-span-4">
          <OTPAttendance onSuccess={fetchStudentAttendance} />
        </div>
      </div>

      {/* Bottom row: Breakdown & history list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <SubjectBreakdown records={records} />
        </div>

        <div className="lg:col-span-5">
          <HistoryLogs records={records} />
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
