import React, { useState, useEffect } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { attendanceService } from '../../api/attendance';

function StudentDashboard() {
  const parentContext = useOutletContext() || {};
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0 });
  const [loading, setLoading] = useState(true);

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
    <Outlet context={{ ...parentContext, records, stats, fetchStudentAttendance }} />
  );
}

export default StudentDashboard;
