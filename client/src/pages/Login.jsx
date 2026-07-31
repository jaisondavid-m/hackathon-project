import React, { useState } from 'react';
import { Mail, Lock, LogIn, AlertCircle, Info } from 'lucide-react';
import { authService } from '../api/auth';
import InputField from '../components/InputField';

function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    emailid: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#EEF1F9] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background graphic elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#7D53F6]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#7D53F6]/10 blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md z-10">
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-xl p-8 sm:p-10 transition-all duration-300">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex bg-[#7D53F6] text-white p-3 rounded-2xl shadow-lg shadow-[#7D53F6]/20 mb-4">
              <span className="font-extrabold tracking-wider text-xl">PCDP</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              PCDP 4.0
            </h1>
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mt-1">
              Attendance Management System
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 text-sm animate-shake">
              <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="Email ID"
              type="email"
              name="emailid"
              value={formData.emailid}
              onChange={handleChange}
              placeholder="e.g. admin@example.com"
              icon={Mail}
              required
              disabled={loading}
            />

            <InputField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              icon={Lock}
              required
              disabled={loading}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#7D53F6] hover:bg-[#683cdb] text-white font-bold rounded-2xl shadow-lg shadow-[#7D53F6]/20 hover:shadow-[#7D53F6]/30 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:bg-[#7D53F6]/60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Access Policy Info */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-start gap-3 text-slate-500 text-xs">
            <Info className="flex-shrink-0 mt-0.5 text-[#7D53F6]" size={16} />
            <p className="leading-relaxed">
              No registration option is available on this portal. Users must be added manually by a system administrator.
            </p>
          </div>

        </div>

        {/* Footer notes */}
        <div className="text-center mt-6 text-xs text-slate-400 font-semibold tracking-wider uppercase">
          &copy; {new Date().getFullYear()} PCDP Attendance System
        </div>
      </div>
    </div>
  );
}

export default Login;
