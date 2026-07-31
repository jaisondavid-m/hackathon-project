import React, { useState } from 'react';
import { UserPlus, Users, ShieldAlert, Award, GraduationCap, AlertCircle, CheckCircle, Mail, Key } from 'lucide-react';
import { authService } from '../api/auth';
import InputField from '../components/InputField';

function AdminDashboard() {
  const [formData, setFormData] = useState({
    name: '',
    emailid: '',
    password: '',
    role: 'student', // Default role
  });

  const [createdUsers, setCreatedUsers] = useState([
    { id: 1, name: 'Admin User', emailid: 'admin@example.com', role: 'admin', created_at: new Date().toISOString() },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => ({
      ...prev,
      role,
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const newUser = await authService.addUser(formData);
      setSuccess(`User "${newUser.name}" successfully created!`);
      // Add the new user to our local list for immediate visual confirmation
      setCreatedUsers((prev) => [
        {
          id: newUser.id,
          name: newUser.name,
          emailid: newUser.emailid,
          role: newUser.role,
          created_at: newUser.created_at || new Date().toISOString(),
        },
        ...prev,
      ]);
      // Reset form
      setFormData({
        name: '',
        emailid: '',
        password: '',
        role: 'student',
      });
    } catch (err) {
      console.error('Create user error:', err);
      const errMsg = err.response?.data?.error || 'Failed to create user. Please check fields or server connection.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Get corresponding icon for list
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <ShieldAlert size={18} className="text-amber-500" />;
      case 'faculty':
        return <Award size={18} className="text-[#7D53F6]" />;
      default:
        return <GraduationCap size={18} className="text-emerald-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Intro Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Console</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1.5 font-medium">
          Create new student or faculty credentials. Users cannot register themselves on the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Create User Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl">
                <UserPlus size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Add New System User</h2>
            </div>

            {/* Notifications */}
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 text-sm">
                <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-700 text-sm">
                <CheckCircle className="flex-shrink-0 mt-0.5" size={18} />
                <span className="font-semibold">{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Dr. John Doe"
                required
                disabled={loading}
              />

              <InputField
                label="Email ID"
                type="email"
                name="emailid"
                value={formData.emailid}
                onChange={handleChange}
                placeholder="e.g. john@university.edu"
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
                placeholder="Minimum 6 characters"
                icon={Key}
                required
                disabled={loading}
              />

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                  Assigned System Role
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'student', label: 'Student', icon: GraduationCap, color: 'text-emerald-600', activeBg: 'border-emerald-500 bg-emerald-50/30' },
                    { id: 'faculty', label: 'Faculty', icon: Award, color: 'text-[#7D53F6]', activeBg: 'border-[#7D53F6] bg-[#7D53F6]/5' },
                    { id: 'admin', label: 'Admin', icon: ShieldAlert, color: 'text-amber-600', activeBg: 'border-amber-500 bg-amber-50/30' },
                  ].map((roleOption) => {
                    const isSelected = formData.role === roleOption.id;
                    const Icon = roleOption.icon;
                    return (
                      <button
                        key={roleOption.id}
                        type="button"
                        onClick={() => handleRoleChange(roleOption.id)}
                        disabled={loading}
                        className={`flex flex-col items-center justify-center py-4 px-3 border rounded-2xl transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? `${roleOption.activeBg} border-2 ring-1 ring-slate-100 shadow-sm`
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <Icon className={`mb-1.5 ${isSelected ? roleOption.color : 'text-slate-400'}`} size={20} />
                        <span className={`text-xs font-bold ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                          {roleOption.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#7D53F6] hover:bg-[#683cdb] text-white font-bold rounded-2xl shadow-lg shadow-[#7D53F6]/20 transition-all duration-200 cursor-pointer disabled:bg-[#7D53F6]/60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={18} />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: User Management View / Overview */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                  <Users size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Console Users</h2>
              </div>
              <span className="bg-[#EEF1F9] text-[#7D53F6] text-xs font-bold px-2.5 py-1 rounded-full border border-slate-100">
                {createdUsers.length} total
              </span>
            </div>

            {/* List */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {createdUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 rounded-2xl border border-slate-100/50 transition-colors duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF1F9]/60 flex items-center justify-center border border-slate-100">
                      {getRoleIcon(u.role)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-700 text-sm leading-tight">
                        {u.name}
                      </h4>
                      <p className="text-slate-400 text-xs mt-0.5 font-medium leading-none">
                        {u.emailid}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full border border-slate-100">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
