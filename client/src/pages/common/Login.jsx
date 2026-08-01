import React, { useState, useEffect } from 'react';
import { Lock, LogIn, AlertCircle, User, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../api/auth';

function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    emailid: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "17897891420-dpioa5k2k9rcvu1gl8obg2ck3ga03t5a.apps.googleusercontent.com",
          callback: handleGoogleLoginSuccess
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "outline", size: "large", width: 356 }
        );
      }
    };
    
    initGoogle();
    const timer = setTimeout(initGoogle, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleLoginSuccess = async (response) => {
    setError('');
    setLoading(true);
    try {
      const user = await authService.loginGoogle(response.credential);
      onLoginSuccess(user);
    } catch (err) {
      console.error('Google login error:', err);
      const errMsg = err.response?.data?.error || 'Google login authentication failed.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authService.login(formData.emailid, formData.password);
      onLoginSuccess(user);
    } catch (err) {
      console.error('Login error:', err);
      const errMsg =
        err.response?.data?.error || 'Invalid credentials or connection issue. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      console.error('Quick login error:', err);
      const errMsg =
        err.response?.data?.error || 'Quick login failed. Connection issue.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF1F9] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background graphic elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#7D53F6]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#7D53F6]/10 blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-[420px] z-10">
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-2xl p-6 sm:p-8 transition-all duration-300">
          
          {/* Logo & Branding */}
          <div className="flex flex-col items-center justify-center text-center gap-2 mb-8">
            <img src="/logo.png" alt="PCDP Logo" className="h-12 w-auto flex-shrink-0" />
            <div className="flex flex-col items-center">
              <div className="text-xl font-extrabold text-[#7D53F6] tracking-tight leading-none">
                PCDP 4.0
              </div>
              <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-1.5 leading-none">
                Enterprise Attendance
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs animate-shake">
              <AlertCircle className="flex-shrink-0 mt-0.5" size={16} />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email or Username Field */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Email or Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={16} className="group-focus-within:text-[#7D53F6] transition-colors" />
                </div>
                <input
                  type="email"
                  name="emailid"
                  value={formData.emailid}
                  onChange={handleChange}
                  placeholder="e.g. j.doe@bitsathy.ac.in"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F3F5FA] text-slate-900 border border-transparent rounded-xl transition-all duration-200 focus:outline-none focus:bg-white focus:border-[#7D53F6] focus:ring-4 focus:ring-[#7D53F6]/10 text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert("Forgot password feature is currently disabled. Please contact your administrator.")}
                  className="text-[11px] font-bold text-[#7D53F6] hover:text-[#683cdb] transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} className="group-focus-within:text-[#7D53F6] transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#F3F5FA] text-slate-900 border border-transparent rounded-xl transition-all duration-200 focus:outline-none focus:bg-white focus:border-[#7D53F6] focus:ring-4 focus:ring-[#7D53F6]/10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#7D53F6] hover:bg-[#683cdb] text-white font-bold rounded-xl shadow-md shadow-[#7D53F6]/10 hover:shadow-[#7D53F6]/20 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:bg-[#7D53F6]/60 disabled:cursor-not-allowed disabled:scale-100 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>

            {/* Conditional: Dev Panel or Google Sign-In */}
            {import.meta.env.VITE_TESTING === '1' ? (
              <div className="mt-4 pt-3.5 border-t border-slate-100">
                <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest text-center mb-2.5">
                  Developer Panel
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: 'Admin', email: 'admin@bitsathy.ac.in', pwd: 'admin123', color: 'hover:border-amber-400 hover:text-amber-600 hover:shadow-amber-50' },
                    { role: 'Faculty', email: 'faculty@bitsathy.ac.in', pwd: 'faculty', color: 'hover:border-[#7D53F6] hover:text-[#7D53F6] hover:shadow-purple-50' },
                    { role: 'Student', email: 'jaisondavidm.cs25@bitsathy.ac.in', pwd: 'jaison123', color: 'hover:border-emerald-500 hover:text-emerald-600 hover:shadow-emerald-50' }
                  ].map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickLogin(item.email, item.pwd)}
                      className={`py-1.5 px-0.5 border border-slate-100 bg-slate-50/50 rounded-lg transition-all duration-200 cursor-pointer text-center hover:bg-white hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${item.color}`}
                    >
                      <span className="font-extrabold text-[10px] block leading-none">{item.role}</span>
                      <span className="text-[8px] text-slate-400 font-semibold block truncate px-1 mt-0.5 leading-none">{item.email}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col items-center">
              <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest text-center mb-2.5">
                Or continue with
              </div>
              <div id="google-signin-btn" className="w-full flex justify-center" />
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}

export default Login;
