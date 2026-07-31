import React, { useState } from 'react';
import { 
  UserPlus, Users, ShieldAlert, Award, GraduationCap, AlertCircle, CheckCircle, Mail, Key 
} from 'lucide-react';
import { authService } from '../../api/auth';
import InputField from '../../components/InputField';

function UserManagement() {
  // User Management States
  const [formData, setFormData] = useState({
    name: '',
    emailid: '',
    password: '',
    role: 'student',
  });
  const [createdUsers, setCreatedUsers] = useState([
    { id: 1, name: 'Admin User', emailid: 'admin@bitsathy.ac.in', role: 'admin', created_at: new Date().toISOString() },
  ]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // User Handlers
  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (userError) setUserError('');
    if (userSuccess) setUserSuccess('');
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => ({ ...prev, role }));
    if (userError) setUserError('');
    if (userSuccess) setUserSuccess('');
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');
    setUserLoading(true);

    try {
      const newUser = await authService.addUser(formData);
      setUserSuccess(`User "${newUser.name}" successfully created!`);
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
      setFormData({ name: '', emailid: '', password: '', role: 'student' });
    } catch (err) {
      console.error(err);
      setUserError(err.response?.data?.error || 'Failed to create user. Verify email or server connection.');
    } finally {
      setUserLoading(false);
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      {/* Left Column: Create User Form */}
      <div className="lg:col-span-7">
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl">
              <UserPlus size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Add New System User</h2>
          </div>

          {userError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 text-sm">
              <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
              <span className="font-semibold">{userError}</span>
            </div>
          )}

          {userSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-700 text-sm">
              <CheckCircle className="flex-shrink-0 mt-0.5" size={18} />
              <span className="font-semibold">{userSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUserSubmit} className="space-y-5">
            <InputField
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleUserChange}
              placeholder="e.g. Dr. John Doe"
              required
              disabled={userLoading}
            />

            <InputField
              label="Email ID"
              type="email"
              name="emailid"
              value={formData.emailid}
              onChange={handleUserChange}
              placeholder="e.g. john@bitsathy.ac.in"
              icon={Mail}
              required
              disabled={userLoading}
            />

            <InputField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleUserChange}
              placeholder="Minimum 6 characters"
              icon={Key}
              required
              disabled={userLoading}
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
                      disabled={userLoading}
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

            <div className="pt-4">
              <button
                type="submit"
                disabled={userLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#7D53F6] hover:bg-[#683cdb] text-white font-bold rounded-2xl shadow-lg shadow-[#7D53F6]/20 transition-all duration-200 cursor-pointer disabled:bg-[#7D53F6]/60"
              >
                {userLoading ? (
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

      {/* Right Column: Console Users */}
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
  );
}

export default UserManagement;
