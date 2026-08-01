import React, { useState, useEffect, useRef } from 'react';
import {
  Key, AlertCircle, Clock, QrCode, UserCheck, RefreshCw, Check, BookOpen, Calendar, CheckCircle2, ShieldCheck
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
  const [hours, setHours] = useState([
    { hour_number: 1, start_time: '09:00 AM', end_time: '10:00 AM' },
    { hour_number: 2, start_time: '10:00 AM', end_time: '11:00 AM' },
    { hour_number: 3, start_time: '11:00 AM', end_time: '12:00 PM' },
    { hour_number: 4, start_time: '12:00 PM', end_time: '01:00 PM' },
    { hour_number: 5, start_time: '02:00 PM', end_time: '03:00 PM' },
    { hour_number: 6, start_time: '03:00 PM', end_time: '04:00 PM' },
    { hour_number: 7, start_time: '04:00 PM', end_time: '05:00 PM' },
  ]);

  const timerRef = useRef(null);
  const pollRef = useRef(null);

  // Subject code mapping helper
  const classMap = {
    'CS101': 'Computer Science (CS-A)',
    'CS202': 'Data Structures (CS-B)',
    'CS305': 'Web Engineering',
    'CS-302': 'Computer Networks',
    'CS-304': 'Operating Systems',
    'CS-306': 'Database Management',
    'CS-308': 'Compiler Design',
    'CS-310': 'Software Engineering'
  };

  // Restore/Fetch active OTP session on mount
  useEffect(() => {
    fetchHours();
    fetchActiveSession();
    checkTodayStatus();
    return () => {
      stopTimer();
      stopPolling();
    };
  }, []);

  // Helper to check period slot status (Past, Current, Upcoming) based on current clock time
  const getHourStatus = (startTimeStr, endTimeStr) => {
    try {
      const parseTime = (timeStr) => {
        const [time, modifier] = timeStr.split(' ');
        let [hoursVal, minutesVal] = time.split(':');
        let hours = parseInt(hoursVal, 10);
        let minutes = parseInt(minutesVal, 10);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        const d = new Date();
        d.setHours(hours, minutes, 0, 0);
        return d.getTime();
      };
      const now = new Date().getTime();
      const start = parseTime(startTimeStr);
      const end = parseTime(endTimeStr);
      if (now >= start && now <= end) return 'Current';
      if (now < start) return 'Upcoming';
      return 'Past';
    } catch (e) {
      return 'Upcoming';
    }
  };

  const fetchHours = async () => {
    try {
      const data = await configService.getHourConfigs();
      if (data && data.length > 0) {
        const sorted = [...data].sort((a, b) => a.hour_number - b.hour_number);
        setHours(sorted);

        // Auto-select current active slot if any
        const current = sorted.find(h => getHourStatus(h.start_time, h.end_time) === 'Current');
        if (current) {
          setSelectedHour(current.hour_number);
        }
      }
    } catch (err) {
      console.error('Failed to fetch hours config:', err);
    }
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
    setSelectedHour(session.hour_number);

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

  // Generate OTP Session
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

  // Deactivate OTP Session
  const handleDeactivateOTP = () => {
    stopTimer();
    stopPolling();
    setActiveSession(null);
    setScannedStudents([]);
  };

  // Format countdown clock MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Helper values for Preview UI
  const getSessionDateStr = () => {
    const targetDate = activeSession ? new Date(activeSession.created_at) : new Date();
    const day = String(targetDate.getDate()).padStart(2, '0');
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const year = String(targetDate.getFullYear()).slice(-2);
    return `${day}${month}${year}`;
  };

  const resolveSubjectName = () => {
    if (activeSession) {
      return classMap[activeSession.class_id] || activeSession.class_id;
    }
    try {
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = weekdays[new Date().getDay()];
      const dayLookup = currentDay === 'Saturday' || currentDay === 'Sunday' ? 'Monday' : currentDay;
      
      const timetableData = {
        Monday: {
          1: { subject: 'Computer Networks' },
          2: { subject: 'Operating Systems' },
          3: null,
          4: { subject: 'Database Management' },
          5: { subject: 'Compiler Design' },
        },
        Tuesday: {
          2: { subject: 'Database Management' },
          3: { subject: 'Computer Networks' },
          5: { subject: 'Software Engineering' },
          6: { subject: 'Operating Systems' },
        },
        Wednesday: {
          1: { subject: 'Compiler Design' },
          3: { subject: 'Software Engineering' },
          4: { subject: 'Computer Networks' },
        },
        Thursday: {
          1: { subject: 'Operating Systems' },
          2: { subject: 'Compiler Design' },
          5: { subject: 'Database Management' },
        },
        Friday: {
          3: { subject: 'Software Engineering' },
          4: { subject: 'Computer Networks' },
          5: { subject: 'Compiler Design' },
          6: { subject: 'Database Management' },
        },
      };

      const slot = timetableData[dayLookup]?.[selectedHour];
      if (slot) return slot.subject;
    } catch (e) {}
    return 'Data Structures';
  };

  const resolveDisplayDate = () => {
    const d = activeSession ? new Date(activeSession.created_at) : new Date();
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const resolveSessionId = () => {
    let classCode = 'DS';
    if (activeSession) {
      classCode = activeSession.class_id;
    } else {
      try {
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = weekdays[new Date().getDay()];
        const dayLookup = currentDay === 'Saturday' || currentDay === 'Sunday' ? 'Monday' : currentDay;
        const timetableData = {
          Monday: { 1: 'CS-302', 2: 'CS-304', 4: 'CS-306', 5: 'CS-308' },
          Tuesday: { 2: 'CS-306', 3: 'CS-302', 5: 'CS-310', 6: 'CS-304' },
          Wednesday: { 1: 'CS-308', 3: 'CS-310', 4: 'CS-302' },
          Thursday: { 1: 'CS-304', 2: 'CS-308', 5: 'CS-306' },
          Friday: { 3: 'CS-310', 4: 'CS-302', 5: 'CS-308', 6: 'CS-306' },
        };
        classCode = timetableData[dayLookup]?.[selectedHour] || 'DS';
      } catch (e) {}
    }
    const idxStr = activeSession ? String(activeSession.id).padStart(3, '0') : '001';
    return `${classCode}-H${selectedHour}-${getSessionDateStr()}-${idxStr}`;
  };

  const selectedHourConfig = hours.find(h => h.hour_number === selectedHour);
  const displayOTP = activeSession ? activeSession.otp : '';
  const otpDigits = displayOTP ? displayOTP.split('') : ['', '', '', '', '', ''];

  const filteredHours = todayOverride && todayOverride.is_half_day
    ? hours.filter(h => h.hour_number <= 4)
    : hours;

  return (
    <div className="w-full flex-grow flex flex-col justify-between overflow-hidden">
      {/* 2-Column Responsive Layout - Split when session is active to display live scan records */}
      <div className={`grid grid-cols-1 ${activeSession ? 'xl:grid-cols-12' : 'w-full'} gap-6 items-stretch flex-grow`}>
        
        {/* Left Column: Form & Mockup Preview boxes */}
        <div className={`${activeSession ? 'xl:col-span-7' : 'w-full'} flex flex-col justify-between space-y-5`}>
          
          {/* Section 1: Hour Selector */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#7D53F6] text-white flex items-center justify-center font-extrabold text-xs shadow-xs select-none">
                1
              </div>
              <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                Select Current Hour (Period)
              </h3>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              {filteredHours.map((hr) => {
                const isSelected = selectedHour === hr.hour_number;
                const status = getHourStatus(hr.start_time, hr.end_time);
                const isPast = status === 'Past';
                const isCurrent = status === 'Current';

                return (
                  <button
                    key={hr.hour_number}
                    type="button"
                    disabled={!!activeSession}
                    onClick={() => setSelectedHour(hr.hour_number)}
                    className={`relative flex flex-col items-center justify-between pt-4 pb-0 rounded-2xl border transition-all duration-200 overflow-hidden bg-white group ${
                      isSelected
                        ? 'border-[#7D53F6] ring-1 ring-[#7D53F6]/20'
                        : 'border-slate-200/80 hover:border-slate-300'
                    } ${activeSession ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{ minHeight: '115px' }}
                  >
                    {/* Checkbox indicator */}
                    <div className="absolute top-2.5 right-2.5">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#7D53F6] flex items-center justify-center text-white">
                          <Check size={10} strokeWidth={3.5} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-200 bg-slate-50/50" />
                      )}
                    </div>

                    <span className="font-extrabold text-[12px] text-slate-800">
                      H{hr.hour_number}
                    </span>

                    <div className={`my-1.5 text-slate-400 ${isSelected ? 'text-[#7D53F6]' : 'group-hover:text-slate-500'}`}>
                      <Clock size={14} />
                    </div>

                    <span className="text-[9px] font-bold text-slate-500 px-1 text-center mb-3">
                      {hr.start_time.replace(':00', '')} - {hr.end_time.replace(':00', '')}
                    </span>

                    <div className={`w-full py-1.5 text-center text-[9px] font-extrabold uppercase tracking-wider ${
                      isSelected
                        ? 'bg-[#7D53F6] text-white'
                        : 'bg-slate-50 text-slate-400 border-t border-slate-100'
                    }`}>
                      {isCurrent ? 'Current' : isPast ? 'Past' : 'Upcoming'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {otpError && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          {todayOverride && todayOverride.is_half_day && (
            <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5 text-amber-700 text-xs font-semibold">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <div>
                <strong>Half Day Notice:</strong> Today is configured as a Half Day ({todayOverride.name}). Only hours H1 to H4 are active.
              </div>
            </div>
          )}

          {/* Section 2: Preview Area */}
          <div className="space-y-3 flex-grow flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#7D53F6] text-white flex items-center justify-center font-extrabold text-xs shadow-xs select-none">
                2
              </div>
              <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                Preview (After Generation)
              </h3>
            </div>

            <div className={`grid grid-cols-1 ${activeSession ? 'md:grid-cols-2' : ''} gap-5`}>
              {/* Left card: OTP code display (Only when session is active) */}
              {activeSession && (
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-50">
                      <div className="p-2 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">OTP Code</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          Share this code with students
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-2.5 my-6">
                      {otpDigits.map((digit, i) => (
                        <div
                          key={i}
                          className={`flex-grow aspect-[3/4] max-w-[50px] rounded-2xl border flex items-center justify-center font-extrabold text-2xl transition-all duration-200 ${
                            activeSession
                              ? 'border-[#7D53F6]/30 bg-[#7D53F6]/5 text-[#7D53F6]'
                              : 'border-slate-200 bg-slate-50/30 text-slate-400'
                          }`}
                        >
                          {digit}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 pt-3.5 border-t border-slate-50">
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${
                      activeSession ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Clock size={11} className={activeSession ? 'animate-pulse' : ''} />
                      <span>Valid for {activeSession ? formatTime(timeLeft) : '05:00'}</span>
                    </div>
                    <span className="text-slate-200">|</span>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar size={11} />
                      <span>Generated at {activeSession ? new Date(activeSession.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '10:30:45 AM'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Right card: QR Code & details */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-50">
                    <div className="p-2 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl">
                      <QrCode size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">QR Code</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        Students can scan this code
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 my-4 w-full">
                    {/* QR Code Container */}
                    <div className={`p-2 rounded-2xl border transition-all duration-200 flex-shrink-0 bg-white ${
                      activeSession ? 'border-[#7D53F6]/20' : 'border-slate-100'
                    }`}>
                      <img
                        src={
                          activeSession
                            ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${activeSession.otp}&color=000000`
                            : `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=preview&color=000000`
                        }
                        alt="Attendance QR Code"
                        className={`object-contain transition-all duration-200 ${
                          activeSession ? 'w-36 h-36' : 'w-22 h-22 opacity-30'
                        }`}
                      />
                    </div>

                    {/* Metadata Table (Only shown before generation) */}
                    {!activeSession && (
                      <div className="w-full max-w-[200px] space-y-2.5 text-[11px] pt-1.5 flex-shrink-0">
                        {/* Subject */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase tracking-wide text-[8px] flex items-center gap-1">
                            <BookOpen size={10} className="text-[#7D53F6]" />
                            Subject
                          </span>
                          <span className="font-extrabold text-slate-700 truncate max-w-[125px]">
                            {resolveSubjectName()}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase tracking-wide text-[8px] flex items-center gap-1">
                            <Calendar size={10} className="text-[#7D53F6]" />
                            Date
                          </span>
                          <span className="font-extrabold text-slate-700">
                            {resolveDisplayDate()}
                          </span>
                        </div>

                        {/* Hour (Period) */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase tracking-wide text-[8px] flex items-center gap-1">
                            <Clock size={10} className="text-[#7D53F6]" />
                            Hour
                          </span>
                          <span className="font-extrabold text-slate-700 text-right">
                            H{selectedHour}
                          </span>
                        </div>

                        {/* Session ID */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase tracking-wide text-[8px] flex items-center gap-1">
                            <Key size={10} className="text-[#7D53F6]" />
                            Session ID
                          </span>
                          <span className="font-extrabold text-slate-700 font-mono tracking-tighter text-[9px] uppercase">
                            {resolveSessionId()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons & unique session message */}
          <div className="space-y-3 pt-2">
            {activeSession ? (
              <button
                onClick={handleDeactivateOTP}
                className="w-full flex items-center justify-center gap-2 py-3.5 font-bold rounded-2xl transition-all duration-200 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 cursor-pointer text-xs"
              >
                <AlertCircle size={15} />
                <span>Deactivate Session Code</span>
              </button>
            ) : (
              <button
                onClick={handleGenerateOTP}
                disabled={otpLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 font-bold rounded-2xl transition-all duration-200 bg-[#7D53F6] hover:bg-[#683cdb] text-white shadow-lg shadow-[#7D53F6]/20 cursor-pointer text-xs"
              >
                {otpLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <QrCode size={15} />
                    <span>Generate OTP & QR Code</span>
                  </>
                )}
              </button>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>Each session code is unique and cannot be reused.</span>
            </div>
          </div>

        </div>

        {/* Right Column: Scanned Students List (Only visible when session is active!) */}
        {activeSession && (
          <div className="xl:col-span-5 space-y-4 border border-slate-100 rounded-3xl p-5 bg-slate-50/20 flex flex-col h-full animate-slideIn max-h-[385px]">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <UserCheck size={15} className="text-emerald-500" />
                Scans Received
              </h4>
              <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2.5 py-0.5 border border-emerald-100 rounded-full flex items-center gap-1">
                <RefreshCw size={8} className="animate-spin" /> {scannedStudents.length} logged
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1 flex-grow">
              {scannedStudents.length > 0 ? (
                scannedStudents.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-2.5 p-2.5 bg-white border border-slate-100/50 rounded-2xl animate-slideIn shadow-xs"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-extrabold text-[9px] select-none">
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
                <div className="text-center py-16 text-slate-400 text-xs">
                  <p className="font-semibold leading-relaxed">
                    Waiting for scans...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default OTPGeneration;
