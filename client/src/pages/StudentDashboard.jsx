import React, { useState, useEffect } from 'react';
import { Percent, Clock, CalendarDays, CheckCircle, AlertTriangle, XCircle, Key, Send } from 'lucide-react';
import { attendanceService } from '../api/attendance';

function StudentDashboard({ user }) {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // OTP Submission state
  const [otp, setOtp] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

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

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setSubmitSuccess('');
    setSubmitError('');

    if (otp.length !== 6) {
      setSubmitError('OTP must be exactly 6 digits.');
      return;
    }

    setSubmitLoading(true);
    try {
      const record = await attendanceService.submitOTP(otp);
      setSubmitSuccess(`Attendance marked for ${record.class_id} - Hour ${record.hour_number}!`);
      setOtp('');
      
      // Re-fetch attendance to update statistics and lists
      await fetchStudentAttendance();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to submit OTP. Code may be invalid or expired.';
      setSubmitError(errMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Denominator (total classes scheduled in the semester)
  const totalClassesScheduled = 38;
  const classesAttended = stats.total; // Present + Late
  const overallPercentage = totalClassesScheduled > 0 
    ? Math.min(100, Math.round((classesAttended / totalClassesScheduled) * 1000) / 10) 
    : 0;

  // Group database records by subject code to calculate subject percentages
  const subjectMap = {
    CS101: { name: 'Computer Science', code: 'CS101', attended: 0, total: 10 },
    CS202: { name: 'Data Structures', code: 'CS202', attended: 0, total: 10 },
    CS305: { name: 'Web Engineering', code: 'CS305', attended: 0, total: 10 },
    MTH201: { name: 'Discrete Mathematics', code: 'MTH201', attended: 0, total: 8 },
  };

  // Compute subject attendance based on real DB records
  records.forEach((rec) => {
    if (subjectMap[rec.class_id]) {
      subjectMap[rec.class_id].attended++;
    }
  });

  const subjectAttendance = Object.values(subjectMap).map((sub) => {
    const percentage = Math.round((sub.attended / sub.total) * 100);
    return {
      ...sub,
      percentage,
      status: percentage >= 85 ? 'excellent' : percentage >= 75 ? 'good' : 'warning',
    };
  });

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

  const getPercentageColor = (pct) => {
    if (pct >= 85) return 'text-emerald-600';
    if (pct >= 75) return 'text-[#7D53F6]';
    return 'text-rose-500';
  };

  const getPercentageBg = (pct) => {
    if (pct >= 85) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-[#7D53F6]';
    return 'bg-rose-500';
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

      {/* Main Stats and OTP Input Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 items-start">
        {/* Left Column: Overall stats (overall % and counts) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Overall Percentage Card */}
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 flex items-center justify-between col-span-1 md:col-span-2">
            <div className="space-y-2 flex-grow pr-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Overall Attendance</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black ${getPercentageColor(overallPercentage)}`}>
                  {overallPercentage}%
                </span>
                <span className="text-xs font-bold text-slate-400">Target: 75% min</span>
              </div>
              {/* Visual Progress bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getPercentageBg(overallPercentage)}`}
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
            </div>
            <div className="bg-[#7D53F6]/5 text-[#7D53F6] w-14 h-14 rounded-2xl flex items-center justify-center border border-[#7D53F6]/10 flex-shrink-0">
              <Percent size={28} />
            </div>
          </div>

          {/* Classes Count Card */}
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Attended Sessions</span>
              <span className="text-3xl font-black text-slate-800 block">
                {classesAttended} <span className="text-sm font-semibold text-slate-400">/ {totalClassesScheduled}</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                Semester Standing
              </span>
            </div>
            <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center border border-emerald-100">
              <CheckCircle size={22} />
            </div>
          </div>
        </div>

        {/* Right Column: OTP Code Entry Widget */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Key size={16} className="text-[#7D53F6]" />
              Enter Attendance OTP
            </h3>

            {submitError && (
              <div className="mb-3.5 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-1.5 animate-shake">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="mb-3.5 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                <CheckCircle size={14} className="flex-shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            <form onSubmit={handleOTPSubmit} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '')); // only digits
                  if (submitError) setSubmitError('');
                  if (submitSuccess) setSubmitSuccess('');
                }}
                placeholder="e.g. 583921"
                disabled={submitLoading}
                className="flex-grow px-3.5 py-2 border border-slate-200 bg-white text-slate-800 text-center font-extrabold text-sm tracking-widest rounded-xl focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all duration-200"
              />
              <button
                type="submit"
                disabled={submitLoading || otp.length !== 6}
                className="bg-[#7D53F6] hover:bg-[#683cdb] text-white p-2.5 rounded-xl cursor-pointer shadow-md shadow-[#7D53F6]/15 hover:shadow-[#7D53F6]/25 transition-all duration-200 flex items-center justify-center disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-100 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {submitLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Subject Breakdown List */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
              <Percent size={18} className="text-[#7D53F6]" />
              Subject Breakdown
            </h2>

            <div className="space-y-6">
              {subjectAttendance.map((sub) => {
                const isAlert = sub.percentage < 75;
                return (
                  <div key={sub.code} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-semibold text-slate-700 block">
                          {sub.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                          Code: {sub.code}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-black ${getPercentageColor(sub.percentage)} text-base block`}>
                          {sub.percentage}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          {sub.attended} / {sub.total} sessions
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getPercentageBg(sub.percentage)}`}
                        style={{ width: `${sub.percentage}%` }}
                      />
                    </div>
                    {isAlert && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-500 font-bold uppercase tracking-wider">
                        <AlertTriangle size={12} />
                        <span>Warning: Attendance below mandatory 75% threshold</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Real-Time Log History */}
        <div className="lg:col-span-5">
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
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
