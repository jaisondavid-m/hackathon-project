import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  QrCode,
  ArrowLeft,
  Timer,
  Delete,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Camera,
  X,
  RefreshCw
} from 'lucide-react';
import { attendanceService } from '../../api/attendance';

function OTPAttendance() {
  const { stats, fetchStudentAttendance } = useOutletContext();
  const navigate = useNavigate();

  // 6 separate inputs state
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // QR Scanner Modal State
  const [showScanner, setShowScanner] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle'); // idle | scanning | success | error

  // Countdown timer state
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Refs for each input box
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Combined OTP string
  const otp = otpValues.join('');

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown]);



  const handleResendCode = () => {
    if (!canResend) return;
    setSubmitSuccess('');
    setSubmitError('');

    // Simulate code resend success
    setSubmitSuccess('A new secure verification code has been sent to your email.');
    setCountdown(30);
  };

  const handleInputChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '').substring(0, 1);

    setOtpValues((prev) => {
      const next = [...prev];
      next[index] = cleanValue;
      return next;
    });

    if (submitError) setSubmitError('');
    if (submitSuccess) setSubmitSuccess('');

    // If filled, move focus to next input
    if (cleanValue && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        setOtpValues((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
        inputRefs[index - 1].current?.focus();
      } else {
        setOtpValues((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').substring(0, 6);

    if (pastedData) {
      const nextValues = [...otpValues];
      for (let i = 0; i < 6; i++) {
        nextValues[i] = pastedData[i] || '';
      }
      setOtpValues(nextValues);

      const nextFocusIndex = Math.min(pastedData.length, 5);
      inputRefs[nextFocusIndex].current?.focus();
    }
  };

  const handleKeypadPress = (val) => {
    if (submitLoading || isVerified) return;

    if (val === 'Clear') {
      setOtpValues(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();
      return;
    }

    if (val === 'Delete') {
      let lastFilledIdx = -1;
      for (let i = 5; i >= 0; i--) {
        if (otpValues[i]) {
          lastFilledIdx = i;
          break;
        }
      }
      if (lastFilledIdx !== -1) {
        setOtpValues((prev) => {
          const next = [...prev];
          next[lastFilledIdx] = '';
          return next;
        });
        inputRefs[lastFilledIdx].current?.focus();
      }
      return;
    }

    const firstEmptyIdx = otpValues.indexOf('');
    if (firstEmptyIdx !== -1) {
      setOtpValues((prev) => {
        const next = [...prev];
        next[firstEmptyIdx] = val.toString();
        return next;
      });
      if (firstEmptyIdx < 5) {
        inputRefs[firstEmptyIdx + 1].current?.focus();
      }
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setSubmitSuccess('');
    setSubmitError('');

    if (otp.length !== 6) {
      setSubmitError('Verification code must be exactly 6 digits.');
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

          setIsVerified(true);
          setSubmitSuccess(`Attendance marked for ${record.class_id} - Hour ${record.hour_number}!`);
          setOtpValues(['', '', '', '', '', '']);

          if (fetchStudentAttendance) {
            await fetchStudentAttendance();
          }

          setTimeout(() => {
            navigate('/student/history');
          }, 2000);
        } catch (err) {
          console.error(err);
          const errMsg = err.response?.data?.error || 'Verification failed. Code may be invalid or expired.';
          setSubmitError(errMsg);
        } finally {
          setSubmitLoading(false);
        }
      },
      (error) => {
        console.error(error);
        setSubmitError(`Location access is required to verify boundary attendance: ${error.message}`);
        setSubmitLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const handleSimulateScan = () => {
    setScanStatus('scanning');

    setTimeout(() => {
      const mockScannedOtp = '583921';
      const nextValues = mockScannedOtp.split('');
      setOtpValues(nextValues);
      setScanStatus('success');

      setTimeout(() => {
        setShowScanner(false);
        setScanStatus('idle');
      }, 1000);
    }, 2000);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-full flex flex-col justify-center items-center py-1 relative overflow-hidden">
      {/* Blurred circles for depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[30%] h-[30%] rounded-full bg-[#4F46E5]/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-[#7C3AED]/5 blur-[80px] pointer-events-none" />

      {/* Main card wrapper with white background box */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[440px] bg-white rounded-3xl border border-slate-200/60 shadow-xl p-5 sm:p-6 z-10 my-auto"
      >
        <AnimatePresence mode="wait">
          {!isVerified ? (
            <motion.div
              key="verification-form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3.5 sm:space-y-4"
            >
              {/* Back Button & Header Row */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate('/student/history')}
                  className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-[#4F46E5] transition-colors cursor-pointer group"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-[#4F46E5]/10 text-[#4F46E5] rounded-lg">
                    <Shield size={14} className="stroke-[2]" />
                  </div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
                    Verification Code
                  </h2>
                </div>
              </div>

              {/* Alerts */}
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[11px] sm:text-xs font-semibold flex items-center gap-2 shadow-2xs"
                >
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>{submitError}</span>
                </motion.div>
              )}

              {submitSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-[11px] sm:text-xs font-semibold flex items-center gap-2 shadow-2xs"
                >
                  <CheckCircle size={14} className="flex-shrink-0" />
                  <span>{submitSuccess}</span>
                </motion.div>
              )}

              {/* OTP Input Boxes */}
              <div className="flex justify-center items-center gap-2 sm:gap-2.5 py-0.5">
                {otpValues.map((val, idx) => (
                  <motion.input
                    key={idx}
                    ref={inputRefs[idx]}
                    type="text"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    disabled={submitLoading}
                    className="w-11 h-11 sm:w-12 sm:h-12 bg-white border border-slate-200 rounded-xl text-center text-base sm:text-lg font-extrabold text-slate-800 transition-all focus:outline-none focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 disabled:opacity-50"
                    whileFocus={{ scale: 1.04 }}
                  />
                ))}
              </div>

              {/* Numeric Keypad with Dedicated Background Container */}
              <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-xs">
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'Clear', 0, 'Delete'].map((val) => {
                    const isSpecial = val === 'Clear' || val === 'Delete';
                    return (
                      <motion.button
                        key={val}
                        type="button"
                        onClick={() => handleKeypadPress(val)}
                        disabled={submitLoading}
                        className={`h-10 sm:h-11 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center cursor-pointer transition-all border ${
                          isSpecial
                            ? 'bg-slate-50 border-slate-200/80 text-slate-500 hover:bg-slate-100'
                            : 'bg-white border-slate-200/60 text-slate-800 hover:bg-slate-50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {val === 'Delete' ? <Delete size={16} /> : <span>{val}</span>}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Verification Button */}
              <motion.button
                type="button"
                onClick={handleVerify}
                disabled={submitLoading || otp.length !== 6}
                className="w-full h-11 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase rounded-xl shadow-md shadow-[#4F46E5]/15 hover:shadow-lg hover:shadow-[#4F46E5]/25 cursor-pointer disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {submitLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Verify & Continue</span>
                  </>
                )}
              </motion.button>

              {/* Scan QR Code Secondary Button */}
              <motion.button
                type="button"
                onClick={() => setShowScanner(true)}
                disabled={submitLoading}
                className="w-full h-10 bg-white border border-[#4F46E5]/30 text-[#4F46E5] hover:bg-[#4F46E5]/5 font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <QrCode size={15} />
                <span>Scan QR Code</span>
              </motion.button>

            </motion.div>
          ) : (
            <motion.div
              key="success-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center justify-center text-center py-12 sm:py-16 space-y-3 sm:space-y-4"
            >
              <svg className="w-16 h-16 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                />
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  d="M22 4L12 14.01l-3-3"
                />
              </svg>

              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-1">
                Verified Successfully
              </h2>
              <p className="text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-wider">
                Redirecting to dashboard...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* QR Code Scanner Dialog Modal */}
      <AnimatePresence>
        {showScanner && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-[#E5E7EB]"
            >
              {/* Modal Header */}
              <div className="h-14 px-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <QrCode size={16} className="text-[#4F46E5]" />
                  Scan Attendance QR Code
                </h3>
                <button
                  onClick={() => {
                    setShowScanner(false);
                    setScanStatus('idle');
                  }}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all cursor-pointer focus:outline-none"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 flex flex-col items-center space-y-5">
                <div className="w-56 h-56 bg-slate-950 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center border-4 border-slate-800 shadow-inner">
                  {scanStatus === 'scanning' ? (
                    <>
                      <motion.div
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_1.5px_rgba(239,68,68,0.8)] z-20 pointer-events-none"
                      />
                      <div className="absolute inset-6 border border-white/20 rounded-lg pointer-events-none z-10" />
                      <div className="text-center text-white/50 text-[9px] font-bold uppercase tracking-widest animate-pulse flex flex-col items-center gap-1.5">
                        <Camera size={20} className="text-[#4F46E5]" />
                        <span>Searching for QR Code...</span>
                      </div>
                    </>
                  ) : scanStatus === 'success' ? (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-center text-emerald-400 font-extrabold text-[10px] uppercase tracking-widest flex flex-col items-center gap-1.5"
                    >
                      <CheckCircle size={30} className="text-emerald-400" />
                      <span>Code Detected!</span>
                    </motion.div>
                  ) : (
                    <div className="text-center text-slate-500 text-[9px] font-bold uppercase tracking-widest flex flex-col items-center gap-2 p-3">
                      <Camera size={20} className="text-slate-600" />
                      <span>Scanner ready. Click simulate below to start camera scan.</span>
                    </div>
                  )}
                </div>

                <div className="text-center text-[11px] font-semibold text-slate-500 leading-normal max-w-[240px]">
                  {scanStatus === 'scanning' ? (
                    <span className="text-[#4F46E5]">Simulating visual capturing and boundary geofence check...</span>
                  ) : scanStatus === 'success' ? (
                    <span className="text-emerald-600">Verification OTP populated successfully.</span>
                  ) : (
                    <span>Position the QR code inside the camera viewfinder to scan.</span>
                  )}
                </div>

                {scanStatus === 'idle' && (
                  <button
                    onClick={handleSimulateScan}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw size={12} />
                    <span>Simulate Scanner Scan</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default OTPAttendance;
