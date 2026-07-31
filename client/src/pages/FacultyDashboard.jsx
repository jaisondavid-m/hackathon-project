import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, ClipboardList, CheckCircle, Search, UserCheck, 
  AlertCircle, Key, QrCode, Clock, RefreshCw, Layers
} from 'lucide-react';
import { attendanceService } from '../api/attendance';
import { venueService } from '../api/venue';

function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState('otp'); // 'otp' or 'manual'
  const [selectedClass, setSelectedClass] = useState('CS101');
  const [selectedHour, setSelectedHour] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState('');
  
  // OTP Session States
  const [activeSession, setActiveSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [scannedStudents, setScannedStudents] = useState([]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  
  // Venue States
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState('');

  const timerRef = useRef(null);
  const pollRef = useRef(null);

  const classes = [
    { id: 'CS101', name: 'Computer Science (CS-A)', time: '09:00 AM - 10:00 AM', count: 5 },
    { id: 'CS202', name: 'Data Structures (CS-B)', time: '11:30 AM - 12:30 PM', count: 4 },
    { id: 'CS305', name: 'Web Engineering', time: '02:00 PM - 03:00 PM', count: 5 },
  ];

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

  // Restore/Fetch active OTP session and Venues list on mount/class change
  useEffect(() => {
    fetchActiveSession();
    fetchVenues();
    return () => {
      stopTimer();
      stopPolling();
    };
  }, [selectedClass]);

  const fetchVenues = async () => {
    try {
      const vData = await venueService.getVenues();
      setVenues(vData);
      if (vData.length > 0) {
        setSelectedVenue(vData[0].id);
      }
    } catch (err) {
      console.error('Failed to load class venues:', err);
    }
  };

  const fetchActiveSession = async () => {
    try {
      const activeSessions = await attendanceService.getActiveSessions();
      // Find session for currently selected class
      const currentClassSession = activeSessions.find(s => s.class_id === selectedClass);
      if (currentClassSession) {
        startTimerAndPolling(currentClassSession);
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
        session.class_id,
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
    if (!selectedVenue) {
      setOtpError('Please select a venue before generating a session.');
      return;
    }
    setOtpError('');
    setOtpLoading(true);
    try {
      const session = await attendanceService.startSession(selectedClass, selectedHour, selectedVenue);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Faculty Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium flex items-center gap-2">
            <Calendar size={16} className="text-[#7D53F6]" />
            Manage attendance sheets or start an OTP session.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#EEF1F9] p-1.5 rounded-2xl border border-slate-100/50">
          <button
            onClick={() => setActiveTab('otp')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold tracking-wider uppercase rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === 'otp'
                ? 'bg-white text-[#7D53F6] shadow-sm'
                : 'text-slate-500 hover:text-[#7D53F6]'
            }`}
          >
            <Key size={14} />
            <span>OTP & QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold tracking-wider uppercase rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white text-[#7D53F6] shadow-sm'
                : 'text-slate-500 hover:text-[#7D53F6]'
            }`}
          >
            <Layers size={14} />
            <span>Manual Sheet</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Class schedule list */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ClipboardList size={18} className="text-[#7D53F6]" />
              Schedule List
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

        {/* Right column: Action views */}
        <div className="lg:col-span-8">
          
          {/* TAB 1: OTP & QR CODE ATTENDANCE GENERATOR */}
          {activeTab === 'otp' && (
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
                        Selected: {classes.find(c => c.id === selectedClass)?.name}
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
                    {/* Venue Selector */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Select Class Venue (Geofenced Bounding Box)
                      </label>
                      <select
                        value={selectedVenue}
                        onChange={(e) => setSelectedVenue(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 bg-white text-slate-855 text-sm font-semibold rounded-xl focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all cursor-pointer"
                      >
                        {venues.length > 0 ? (
                          venues.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))
                        ) : (
                          <option value="">No Geofenced Venues Defined</option>
                        )}
                      </select>
                    </div>

                    {/* Hour Number Selector */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Select Current Hour (Period)
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((hr) => (
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
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#7D53F6] hover:bg-[#683cdb] text-white font-bold rounded-2xl shadow-lg shadow-[#7D53F6]/20 transition-all duration-200 cursor-pointer"
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
                      {classes.find(c => c.id === selectedClass)?.name} &bull; Hour {activeSession.hour_number}
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
          )}

          {/* TAB 2: MANUAL ATTENDANCE SHEET CHECKLIST */}
          {activeTab === 'manual' && (
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
          )}

        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;
