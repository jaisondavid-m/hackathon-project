import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Key, AlertTriangle, CheckCircle, Send } from 'lucide-react';
import { attendanceService } from '../../api/attendance';
import StudentStats from './StudentStats';

function OTPAttendance() {
  const { stats, fetchStudentAttendance } = useOutletContext();
  const [otp, setOtp] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setSubmitSuccess('');
    setSubmitError('');

    if (otp.length !== 6) {
      setSubmitError('OTP must be exactly 6 digits.');
      return;
    }

    if (!navigator.geolocation) {
      setSubmitError('Geolocation is not supported by your browser. Geofence verification failed.');
      return;
    }

    setSubmitLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const record = await attendanceService.submitOTP(otp, latitude, longitude);
          setSubmitSuccess(`Attendance marked for ${record.class_id} - Hour ${record.hour_number}!`);
          setOtp('');
          
          if (fetchStudentAttendance) {
            await fetchStudentAttendance();
          }
        } catch (err) {
          console.error(err);
          const errMsg = err.response?.data?.error || 'Failed to submit OTP. Code may be invalid or expired.';
          setSubmitError(errMsg);
        } finally {
          setSubmitLoading(false);
        }
      },
      (error) => {
        console.error(error);
        setSubmitError(`Location access is required to mark attendance: ${error.message}`);
        setSubmitLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Overall stats */}
      <div className="lg:col-span-8">
        <StudentStats stats={stats} />
      </div>

      {/* Right Column: OTP Code Entry Widget */}
      <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100/80 shadow-md p-6">
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
        <div className="mt-3.5 flex items-start gap-1.5 text-[10px] text-slate-400 font-semibold leading-normal">
          <span className="text-[#7D53F6] flex-shrink-0">⚠️</span>
          <span>GPS permission will be requested to verify you are inside the designated venue boundaries.</span>
        </div>
      </div>
    </div>
  );
}

export default OTPAttendance;
