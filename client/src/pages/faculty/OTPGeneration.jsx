import React, { useState, useEffect, useRef } from 'react';
import { 
  Key, AlertCircle, Clock, QrCode, UserCheck, RefreshCw 
} from 'lucide-react';
import { attendanceService } from '../../api/attendance';
import { configService } from '../../api/config';

function OTPGeneration() {
  const [selectedHour, setSelectedHour] = useState(1);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [scannedStudents, setScannedStudents] = useState([]);
  const [todayOverride, setTodayOverride] = useState(null);

  const timerRef = useRef(null);
  const pollRef = useRef(null);

  // Restore/Fetch active OTP session on mount
  useEffect(() => {
    fetchActiveSession();
    checkTodayStatus();
    return () => {
      stopTimer();
      stopPolling();
    };
  }, []);

  const checkTodayStatus = async () => {
    try {
      const holidaysList = await configService.getHolidays();
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const override = holidaysList.find(h => h.date === todayStr);
      if (override) {
        setTodayOverride(override);
        if (override.is_half_day && selectedHour > 4) {
          setSelectedHour(1);
        }
      }
    } catch (err) {
      console.error('Failed to fetch today status check:', err);
    }
  };

  const fetchActiveSession = async () => {
    try {
      const activeSessions = await attendanceService.getActiveSessions();
      if (activeSessions && activeSessions.length > 0) {
        startTimerAndPolling(activeSessions[0]);
      } else {
        stopTimer();
        stopPolling();
        setActiveSession(null);
        setScannedStudents([]);
      }
    } catch (err) {
      console.error('Error fetching active session:', err);
    }
  };

  const startTimerAndPolling = (session) => {
    setActiveSession(session);
    
    // Set timer
    const expiryTime = new Date(session.expires_at).getTime();
    const now = new Date().getTime();
    const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
    setTimeLeft(remaining);

    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          stopPolling();
          setActiveSession(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start polling logged attendance records
    fetchClassLogs(session);
    stopPolling();
    pollRef.current = setInterval(() => {
      fetchClassLogs(session);
    }, 3000);
  };

  const fetchClassLogs = async (session) => {
    try {
      const logs = await attendanceService.getClassLogs(
        '', // class_id is empty/GENERAL
        session.hour_number,
        session.date
      );
      setScannedStudents(logs);
    } catch (err) {
      console.error('Error polling logs:', err);
    }
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
  };

  // Generate OTP Session (Faculty only selects Hour/Period)
  const handleGenerateOTP = async () => {
    setOtpError('');
    setOtpLoading(true);
    try {
      const session = await attendanceService.startSession('', selectedHour, 0);
      startTimerAndPolling(session);
    } catch (err) {
      console.error(err);
      setOtpError(err.response?.data?.error || 'Failed to start OTP session.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Format countdown clock MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 sm:p-8 animate-fadeIn">
      {!activeSession ? (
        // OTP Generation Config Screen
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl">
              <Key size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Generate Session Code</h3>
              <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                Generate OTP and QR Code for class checking
              </p>
            </div>
          </div>

          {otpError && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-semibold flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{otpError}</span>
            </div>
          )}

          <div className="space-y-4">
            {todayOverride && todayOverride.is_half_day && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 text-amber-700 text-xs font-semibold">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Half Day Notice:</strong> Today is configured as a Half Day ({todayOverride.name}). Only hours H1 to H4 are active.
                </div>
              </div>
            )}

            {/* Hour Number Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Current Hour (Period)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {(todayOverride && todayOverride.is_half_day ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7]).map((hr) => (
                  <button
                    key={hr}
                    type="button"
                    onClick={() => setSelectedHour(hr)}
                    className={`py-2 px-1 border text-center text-xs font-extrabold rounded-xl transition-all duration-150 cursor-pointer ${
                      selectedHour === hr
                        ? 'bg-[#7D53F6] border-[#7D53F6] text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    H{hr}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-[#EEF1F9]/50 border border-slate-100 rounded-2xl flex items-start gap-3 text-slate-500 text-xs leading-relaxed">
              <Clock size={18} className="text-[#7D53F6] flex-shrink-0 mt-0.5" />
              <div>
                <strong>How it works:</strong> Clicking generate starts a 5-minute session and outputs a 6-digit OTP code and a scanable QR code. Students can enter the OTP code on their dashboard to mark themselves present.
              </div>
            </div>

            {/* Submit generate */}
            <button
              onClick={handleGenerateOTP}
              disabled={otpLoading}
              className="w-full flex items-center justify-center gap-2 py-3 font-bold rounded-2xl transition-all duration-200 bg-[#7D53F6] hover:bg-[#683cdb] text-white shadow-lg shadow-[#7D53F6]/20 cursor-pointer"
            >
              {otpLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <QrCode size={18} />
                  <span>Generate OTP & QR Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        // OTP Active Session Screen
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Visual OTP and QR Code Card */}
          <div className="md:col-span-7 flex flex-col items-center text-center p-6 border border-[#7D53F6]/20 bg-[#7D53F6]/5 rounded-3xl relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 bg-[#7D53F6] text-white px-3 py-1 rounded-bl-2xl text-[9px] font-bold uppercase tracking-widest">
              Session Active
            </div>

            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mb-1">
              Active Session &bull; Hour {activeSession.hour_number}
            </span>

            {/* Glowing OTP */}
            <div className="my-4 font-black tracking-widest text-[#7D53F6] text-4xl sm:text-5xl bg-white px-6 py-3 rounded-2xl shadow-inner border border-slate-100 select-all">
              {activeSession.otp}
            </div>

            {/* Real Functional QR Code */}
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${activeSession.otp}`}
                alt="Attendance QR Code"
                className="w-32 h-32 object-contain"
              />
              <span className="text-[8px] text-slate-400 font-bold block mt-1 uppercase tracking-wider">
                Scan to Mark Present
              </span>
            </div>

            {/* Timer Countdown */}
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-1.5 border border-rose-100 rounded-full text-xs font-bold shadow-sm">
              <Clock size={14} className="animate-pulse" />
              <span>Expires in {formatTime(timeLeft)}</span>
            </div>

            {/* Manual Stop */}
            <button
              onClick={() => {
                stopTimer();
                stopPolling();
                setActiveSession(null);
                setScannedStudents([]);
              }}
              className="mt-6 text-xs text-rose-500 font-bold hover:underline cursor-pointer"
            >
              Deactivate Session Code
            </button>
          </div>

          {/* Right Column: Scanned Students List */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <UserCheck size={16} className="text-emerald-500" />
                Scans Received
              </h4>
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2.5 py-0.5 border border-emerald-100 rounded-full flex items-center gap-1 animate-pulse">
                <RefreshCw size={8} className="animate-spin" /> {scannedStudents.length} logged
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {scannedStudents.length > 0 ? (
                scannedStudents.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-100/50 rounded-xl animate-slideIn"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-extrabold text-[10px]">
                      P
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-slate-700 text-xs block leading-tight">
                        {log.student_name}
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold block mt-0.5">
                        Logged at {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <p className="font-semibold leading-relaxed">
                    Waiting for students to enter the OTP code...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OTPGeneration;
