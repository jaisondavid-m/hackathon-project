import React, { useState, useEffect, useRef } from 'react';
import {
  Key, AlertCircle, Clock, QrCode, UserCheck, RefreshCw, Calendar, Check
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
  const [hourConfigs, setHourConfigs] = useState([]);
  const [currentHourConfig, setCurrentHourConfig] = useState(null);
  const [systemTime, setSystemTime] = useState(new Date());
  const [copied, setCopied] = useState(false);

  const timerRef = useRef(null);
  const pollRef = useRef(null);

  // Restore/Fetch active OTP session on mount
  useEffect(() => {
    fetchActiveSession();
    checkTodayStatus();

    // Fetch hour configs
    const fetchConfigs = async () => {
      try {
        const configs = await configService.getHourConfigs();
        setHourConfigs(configs);
      } catch (err) {
        console.error('Error fetching hour configs:', err);
      }
    };
    fetchConfigs();

    // Live clock timer
    const clockTimer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);

    return () => {
      stopTimer();
      stopPolling();
      clearInterval(clockTimer);
    };
  }, []);

  // Recalculate current hour based on daily timeslots
  useEffect(() => {
    if (hourConfigs.length === 0) return;

    const currentMinutes = systemTime.getHours() * 60 + systemTime.getMinutes();
    let matched = null;
    let minDiff = Infinity;
    let closest = null;

    for (const config of hourConfigs) {
      const [startH, startM] = config.start_time.split(':').map(Number);
      const [endH, endM] = config.end_time.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        matched = config;
        break;
      }

      // Track closest slot
      const diff = Math.abs(startMinutes - currentMinutes);
      if (diff < minDiff) {
        minDiff = diff;
        closest = config;
      }
    }

    const activeConfig = matched || closest || hourConfigs[0];
    setCurrentHourConfig(activeConfig);
    setSelectedHour(activeConfig.hour_number);
  }, [systemTime, hourConfigs]);

  const handleCopyOTP = () => {
    if (activeSession) {
      navigator.clipboard.writeText(activeSession.otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime12 = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    const minStr = String(m).padStart(2, '0');
    return `${hour12}:${minStr} ${ampm}`;
  };

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
    <div className="w-full flex-grow flex flex-col animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-grow">
        {/* Left Column: Generate Form OR Active Session Info */}
        <div className="lg:col-span-7 space-y-6">
          {!activeSession ? (
            <div className="space-y-6">
              {/* Header block */}
              <div className="flex justify-between items-start pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#7D53F6]/10 text-[#7D53F6] rounded-2xl shadow-sm">
                    <Key size={24} className="stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-slate-800 tracking-tight">Generate Session Code</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Secure OTP & QR Code Check-in
                    </p>
                  </div>
                </div>

                {/* Live clock display */}
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">System Time</span>
                  <span className="text-sm font-black text-[#7D53F6]">
                    {systemTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              {otpError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-semibold flex items-center gap-3 shadow-2xs">
                  <AlertCircle size={18} className="text-rose-500 flex-shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              {/* Status details card */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Target Class Hour</span>
                  {currentHourConfig ? (
                    <span className="text-xs font-extrabold text-slate-800 bg-white px-3 py-1 border border-slate-200 rounded-full shadow-2xs">
                      Hour {currentHourConfig.hour_number}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 animate-pulse font-bold">Checking slots...</span>
                  )}
                </div>

                {currentHourConfig && (
                  <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-2xs">
                    <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                      <Clock size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Timeslot</span>
                      <span className="text-sm font-black text-slate-800">
                        {formatTime12(currentHourConfig.start_time)} - {formatTime12(currentHourConfig.end_time)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-2xs">
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Date of session</span>
                    <span className="text-sm font-black text-slate-800">
                      {systemTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security info alert */}
              <div className="p-4 bg-[#7D53F6]/5 border border-[#7D53F6]/10 rounded-2xl flex items-start gap-3 text-slate-600 text-xs leading-relaxed">
                <AlertCircle size={18} className="text-[#7D53F6] flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Automated Slot Lock:</strong> You can only generate codes for the current slot defined by the administrator. Faculty cannot override period schedules to prevent invalid attendance records.
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={handleGenerateOTP}
                disabled={otpLoading || !currentHourConfig}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 font-bold rounded-2xl transition-all duration-200 bg-[#7D53F6] hover:bg-[#683cdb] text-white shadow-lg shadow-[#7D53F6]/20 hover:shadow-xl hover:shadow-[#7D53F6]/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <QrCode size={18} />
                    <span className="text-sm tracking-wider uppercase">Generate Code for Hour {currentHourConfig?.hour_number || ''}</span>
                  </>
                )}
              </button>

              {/* Timeline list of configured hours */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Full Timetable Schedule
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {hourConfigs.map((cfg) => {
                    const isCurrent = currentHourConfig?.hour_number === cfg.hour_number;
                    return (
                      <div 
                        key={cfg.hour_number}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isCurrent 
                            ? 'bg-[#7D53F6]/5 border-[#7D53F6]/30 text-[#7D53F6] shadow-2xs font-extrabold scale-102'
                            : 'bg-slate-50/50 border-slate-100/60 text-slate-500'
                        }`}
                      >
                        <div className="text-[10px] uppercase font-extrabold tracking-wider">Hour {cfg.hour_number}</div>
                        <div className="text-[9px] font-semibold mt-0.5 opacity-95">
                          {formatTime12(cfg.start_time)} - {formatTime12(cfg.end_time)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center p-6 border border-[#7D53F6]/20 bg-[#7D53F6]/5 rounded-3xl relative overflow-hidden shadow-sm space-y-5">
              <div className="absolute top-0 right-0 bg-[#7D53F6] text-white px-3 py-1 rounded-bl-2xl text-[9px] font-bold uppercase tracking-widest">
                Session Active
              </div>

              <div className="w-full">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mb-1">
                  Active Session &bull; Hour {activeSession.hour_number}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Students must enter this code or scan the QR below to check in.
                </span>
              </div>

              {/* Glowing OTP */}
              <div className="relative group">
                <div className="absolute inset-0 bg-[#7D53F6]/10 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
                <button
                  onClick={handleCopyOTP}
                  title="Click to copy OTP code"
                  className="relative my-2 font-black tracking-widest text-[#7D53F6] text-4xl sm:text-5xl bg-white px-8 py-3 rounded-2xl shadow-md border border-slate-100 select-all cursor-pointer flex items-center gap-3 transition-transform hover:scale-101 focus:outline-none"
                >
                  <span>{activeSession.otp}</span>
                  {copied ? (
                    <Check size={20} className="text-emerald-500 shrink-0 stroke-[3]" />
                  ) : (
                    <RefreshCw size={14} className="text-slate-400 shrink-0 stroke-[2.5]" />
                  )}
                </button>
                {copied && (
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-emerald-600 font-extrabold uppercase tracking-wider">
                    Copied to Clipboard!
                  </span>
                )}
              </div>

              {/* Real Functional QR Code */}
              <div className="bg-white p-4 rounded-3xl shadow-md border border-slate-100 flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${activeSession.otp}`}
                  alt="Attendance QR Code"
                  className="w-36 h-36 object-contain"
                />
                <span className="text-[9px] text-slate-400 font-extrabold block mt-2 uppercase tracking-widest">
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
                className="px-5 py-2 border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl font-bold text-xs cursor-pointer transition-colors shadow-2xs mt-4 focus:outline-none"
              >
                Deactivate Session Code
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Scanned Students List */}
        <div className="lg:col-span-5 space-y-4 border border-slate-100 rounded-3xl p-6 bg-slate-50/40">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <UserCheck size={18} className="text-emerald-500 stroke-[2.5]" />
              Scans Received
            </h4>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 border border-emerald-100 rounded-full flex items-center gap-1.5 shadow-2xs">
              {activeSession && <RefreshCw size={10} className="animate-spin stroke-[2.5]" />} {scannedStudents.length} logged
            </span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {!activeSession ? (
              <div className="text-center py-24 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <UserCheck size={20} className="text-slate-400" />
                </div>
                <p className="font-bold text-sm text-slate-600 leading-relaxed">
                  No active session.
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Generate code to listen for checks.
                </p>
              </div>
            ) : scannedStudents.length > 0 ? (
              scannedStudents.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl animate-slideIn shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
                      {log.student_name ? log.student_name.substring(0, 2).toUpperCase() : 'ST'}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-slate-700 text-sm block leading-tight">
                        {log.student_name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                        {log.student_id || 'Student ID'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border border-emerald-100">
                      Present
                    </span>
                    <span className="text-[8px] text-slate-400 block mt-1 font-bold">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-24 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <RefreshCw size={20} className="text-[#7D53F6] animate-spin" />
                </div>
                <p className="font-bold text-sm text-slate-600 leading-relaxed">
                  Waiting for check-ins...
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Share code with student devices.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OTPGeneration;
