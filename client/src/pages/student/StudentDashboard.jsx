import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Key, Layers } from 'lucide-react';
import { attendanceService } from '../../api/attendance';

function StudentDashboard({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
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

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (location.pathname.includes('/student/history')) return 'history';
    return 'otp';
  };

  const activeTab = getActiveTab();

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
      {/* Header with Switcher Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Student Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Welcome back, {user?.name || 'Student'}! Enter active OTP codes or view your attendance history.
          </p>
        </div>

        <div className="flex bg-[#EEF1F9] p-1.5 rounded-2xl border border-slate-100">
          <button
            onClick={() => navigate('otp')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold tracking-wider uppercase rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === 'otp'
                ? 'bg-white text-[#7D53F6] shadow-sm'
                : 'text-slate-500 hover:text-[#7D53F6]'
            }`}
          >
            <Key size={16} />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => navigate('history')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold tracking-wider uppercase rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-[#7D53F6] shadow-sm'
                : 'text-slate-500 hover:text-[#7D53F6]'
            }`}
          >
            <Layers size={16} />
            <span>Attendance History</span>
          </button>
        </div>
      </div>

      {/* Render child sub-routes */}
      <Outlet context={{ records, stats, fetchStudentAttendance }} />
    </div>
  );
}

export default StudentDashboard;
