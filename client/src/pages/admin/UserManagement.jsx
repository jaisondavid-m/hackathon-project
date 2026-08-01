import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Users, ShieldAlert, Award, GraduationCap, AlertCircle, CheckCircle, Mail, Key, UserMinus, UserCheck, X,
  Upload, Download, FileSpreadsheet, Play, RefreshCw
} from 'lucide-react';
import { authService } from '../../api/auth';
import InputField from '../../components/InputField';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    emailid: '',
    password: '',
    role: 'student',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Individual blocking states
  const [blockingUserId, setBlockingUserId] = useState(null);

  // Bulk upload states
  const [modalTab, setModalTab] = useState('single'); // 'single' | 'bulk'
  const [bulkUsers, setBulkUsers] = useState([]);
  const [bulkProgress, setBulkProgress] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const [bulkError, setBulkError] = useState('');

  const resetForm = () => {
    setFormData({ name: '', emailid: '', password: '', role: 'student' });
    setModalTab('single');
    setBulkUsers([]);
    setBulkProgress('');
    setBulkSuccess('');
    setBulkError('');
    setFormError('');
    setFormSuccess('');
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];
    
    // Extract headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    
    // Find indices of columns
    const nameIdx = headers.indexOf('name');
    const emailIdx = headers.indexOf('emailid');
    const pwdIdx = headers.indexOf('password');
    const roleIdx = headers.indexOf('role');
    
    if (nameIdx === -1 || emailIdx === -1 || pwdIdx === -1 || roleIdx === -1) {
      throw new Error('CSV columns must include: name, emailid, password, role');
    }
    
    const parsedUsers = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Split columns
      const cols = [];
      let current = '';
      let inQuotes = false;
      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const char = line[charIdx];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cols.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cols.push(current.trim());
      
      if (cols.length < 4) continue;
      
      const name = cols[nameIdx];
      const emailid = cols[emailIdx];
      const password = cols[pwdIdx];
      const role = cols[roleIdx]?.toLowerCase();
      
      let rowError = '';
      if (!name) rowError = 'Name is required';
      else if (!emailid) rowError = 'Email ID is required';
      else if (!password) rowError = 'Password is required';
      else if (!role || !['student', 'faculty', 'admin'].includes(role)) rowError = 'Role must be student, faculty, or admin';
      
      parsedUsers.push({
        name,
        emailid,
        password,
        role,
        status: rowError ? 'error' : 'ready',
        message: rowError || 'Ready to upload',
        progress: 'idle'
      });
    }
    
    return parsedUsers;
  };

  const downloadCSVTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,name,emailid,password,role\n"
      + "Dr. Jane Smith,janesmith@bitsathy.ac.in,faculty123,faculty\n"
      + "John Doe,johndoe@bitsathy.ac.in,student123,student\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setBulkError('');
    setBulkSuccess('');
    setBulkProgress('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setBulkError('The uploaded CSV file is empty.');
          return;
        }
        setBulkUsers(parsed);
      } catch (err) {
        setBulkError(err.message);
      }
    };
    reader.onerror = () => {
      setBulkError('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    const readyUsers = bulkUsers.filter(u => u.status === 'ready');
    if (readyUsers.length === 0) {
      setBulkError('No valid users found to upload.');
      return;
    }
    
    setFormLoading(true);
    setBulkError('');
    setBulkSuccess('');
    
    let successCount = 0;
    let failCount = 0;
    
    const updatedUsers = [...bulkUsers];
    
    for (let i = 0; i < updatedUsers.length; i++) {
      if (updatedUsers[i].status !== 'ready') continue;
      
      updatedUsers[i].progress = 'uploading';
      setBulkUsers([...updatedUsers]);
      setBulkProgress(`Uploading user ${i + 1} of ${updatedUsers.length}...`);
      
      try {
        const newUser = await authService.addUser({
          name: updatedUsers[i].name,
          emailid: updatedUsers[i].emailid,
          password: updatedUsers[i].password,
          role: updatedUsers[i].role
        });
        
        updatedUsers[i].progress = 'success';
        updatedUsers[i].status = 'uploaded';
        updatedUsers[i].message = 'Created successfully';
        successCount++;
        
        // Add to main user list
        setUsers((prev) => [newUser, ...prev]);
      } catch (err) {
        console.error(err);
        updatedUsers[i].progress = 'error';
        updatedUsers[i].message = err.response?.data?.error || 'Failed to create user';
        failCount++;
      }
      
      setBulkUsers([...updatedUsers]);
    }
    
    setFormLoading(false);
    setBulkProgress('');
    
    if (failCount === 0) {
      setBulkSuccess(`Successfully registered all ${successCount} users!`);
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
      }, 1500);
    } else {
      setBulkError(`Registered ${successCount} users. Failed for ${failCount} users. Please check errors in the list.`);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await authService.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch registered system users.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
    if (formSuccess) setFormSuccess('');
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => ({ ...prev, role }));
    if (formError) setFormError('');
    if (formSuccess) setFormSuccess('');
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      const newUser = await authService.addUser(formData);
      setFormSuccess(`User account created successfully!`);
      
      // Update users list locally
      setUsers((prev) => [newUser, ...prev]);

      // Reset form and close modal after timeout
      setFormData({ name: '', emailid: '', password: '', role: 'student' });
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess('');
      }, 1000);
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.error || 'Failed to create user. Verify email or passwords.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleBlock = async (userToToggle) => {
    if (blockingUserId) return;
    setBlockingUserId(userToToggle.id);
    setError('');

    try {
      const updatedUser = await authService.toggleBlockUser(userToToggle.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update user block status.');
    } finally {
      setBlockingUserId(null);
    }
  };

  // Helper to extract initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Helper to format date strings
  const formatDateString = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
  };

  // Helper to format full date-time strings
  const formatDateTimeString = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded-full border border-amber-100/50">
            <ShieldAlert size={12} />
            <span>Admin</span>
          </span>
        );
      case 'faculty':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#7D53F6]/5 text-[#7D53F6] text-[10px] font-bold uppercase rounded-full border border-[#7D53F6]/10">
            <Award size={12} />
            <span>Faculty</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-full border border-emerald-100/50">
            <GraduationCap size={12} />
            <span>Student</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">System Users</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Review login activities, toggle accounts block status, or register new users
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7D53F6] hover:bg-[#683cdb] text-white text-xs font-extrabold tracking-wider uppercase rounded-2xl cursor-pointer shadow-md shadow-[#7D53F6]/15 hover:shadow-[#7D53F6]/25 transition-all duration-200 focus:outline-none"
        >
          <UserPlus size={16} />
          <span>Create User</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 text-sm">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-[#7D53F6]/25 border-t-[#7D53F6] rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Retrieving system accounts...</span>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 rounded-3xl bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <th className="p-4 pl-6">User profile</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Date Registered</th>
                <th className="p-4">Last Sign In</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 pr-6 text-center">Security controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/30 text-xs font-semibold text-slate-700 transition-colors">
                    {/* User profile with initials avatar */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#EEF1F9]/50 flex items-center justify-center font-black text-xs text-[#7D53F6] border border-slate-100">
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-sm block leading-none">{u.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium block mt-1 leading-none">{u.emailid}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-4">{getRoleBadge(u.role)}</td>

                    {/* Created At */}
                    <td className="p-4 text-slate-500 font-medium">{formatDateString(u.created_at)}</td>

                    {/* Last Sign In */}
                    <td className="p-4 text-slate-500 font-medium">{formatDateTimeString(u.last_sign)}</td>

                    {/* Block Status */}
                    <td className="p-4">
                      {u.is_blocked ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100/50 text-[9px] font-extrabold uppercase">
                          Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50 text-[9px] font-extrabold uppercase">
                          Active
                        </span>
                      )}
                    </td>

                    {/* Action Block/Unblock toggle */}
                    <td className="p-4 pr-6 text-center">
                      <button
                        onClick={() => handleToggleBlock(u)}
                        disabled={blockingUserId !== null}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase cursor-pointer transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                          u.is_blocked
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                        }`}
                      >
                        {blockingUserId === u.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                        ) : u.is_blocked ? (
                          <>
                            <UserCheck size={12} />
                            <span>Unblock user</span>
                          </>
                        ) : (
                          <>
                            <UserMinus size={12} />
                            <span>Block user</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-semibold uppercase">
                    No registered user accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. MODAL DIALOG POPUP */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-[490px] overflow-hidden animate-zoomIn flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-[#7D53F6]/10 text-[#7D53F6] rounded-lg">
                  <UserPlus size={16} />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">Add System Account</h3>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100 flex-shrink-0 bg-slate-50/20">
              <button
                type="button"
                onClick={() => setModalTab('single')}
                disabled={formLoading}
                className={`flex-grow py-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer ${
                  modalTab === 'single'
                    ? 'border-[#7D53F6] text-[#7D53F6]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Single User
              </button>
              <button
                type="button"
                onClick={() => setModalTab('bulk')}
                disabled={formLoading}
                className={`flex-grow py-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer ${
                  modalTab === 'bulk'
                    ? 'border-[#7D53F6] text-[#7D53F6]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Bulk Upload
              </button>
            </div>

            {modalTab === 'single' ? (
              <form onSubmit={handleUserSubmit} className="p-6 space-y-5 overflow-y-auto flex-grow">
                {formError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-semibold">
                    <AlertCircle className="flex-shrink-0 mt-0.5" size={15} />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-emerald-700 text-xs font-semibold animate-pulse">
                    <CheckCircle className="flex-shrink-0 mt-0.5" size={15} />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <InputField
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleUserChange}
                  placeholder="e.g. Dr. John Doe"
                  required
                  disabled={formLoading}
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
                  disabled={formLoading}
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
                  disabled={formLoading}
                />

                {/* Role Select Options */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 leading-none">
                    System Role
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
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
                          disabled={formLoading}
                          className={`flex flex-col items-center justify-center py-3 border rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-0 ${
                            isSelected
                              ? `${roleOption.activeBg} border-2 ring-1 ring-slate-100 shadow-sm`
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <Icon className={`mb-1 ${isSelected ? roleOption.color : 'text-slate-400'}`} size={18} />
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                            {roleOption.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    disabled={formLoading}
                    className="flex-grow py-3 border border-slate-200 text-slate-500 font-extrabold text-xs tracking-wider uppercase rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors focus:outline-none disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-grow py-3 bg-[#7D53F6] hover:bg-[#683cdb] text-white font-extrabold text-xs tracking-wider uppercase rounded-2xl cursor-pointer shadow-md shadow-[#7D53F6]/15 hover:shadow-[#7D53F6]/25 transition-all duration-200 focus:outline-none disabled:bg-[#7D53F6]/60"
                  >
                    {formLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      <span>Create User</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-5 overflow-y-auto flex-grow flex flex-col">
                {bulkError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-semibold">
                    <AlertCircle className="flex-shrink-0 mt-0.5" size={15} />
                    <span>{bulkError}</span>
                  </div>
                )}

                {bulkSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-emerald-700 text-xs font-semibold animate-pulse">
                    <CheckCircle className="flex-shrink-0 mt-0.5" size={15} />
                    <span>{bulkSuccess}</span>
                  </div>
                )}

                {bulkProgress && (
                  <div className="p-3.5 bg-violet-50 border border-violet-100 rounded-xl flex items-center gap-2.5 text-[#7D53F6] text-xs font-semibold">
                    <RefreshCw className="animate-spin flex-shrink-0" size={15} />
                    <span>{bulkProgress}</span>
                  </div>
                )}

                {/* CSV Template Guideline box */}
                <div className="p-4 bg-slate-50 border border-slate-100/80 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileSpreadsheet size={13} className="text-[#7D53F6]" />
                      Template Guide
                    </span>
                    <button
                      type="button"
                      onClick={downloadCSVTemplate}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#7D53F6] hover:text-[#683cdb] transition-colors cursor-pointer"
                    >
                      <Download size={12} />
                      <span>Download Template</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    CSV file headers must be: <code className="bg-white border border-slate-200 px-1 py-0.5 rounded text-[#7D53F6] font-bold">name</code>, <code className="bg-white border border-slate-200 px-1 py-0.5 rounded text-[#7D53F6] font-bold">emailid</code>, <code className="bg-white border border-slate-200 px-1 py-0.5 rounded text-[#7D53F6] font-bold">password</code>, and <code className="bg-white border border-slate-200 px-1 py-0.5 rounded text-[#7D53F6] font-bold">role</code>.
                  </div>
                </div>

                {/* File Select */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">
                    Select CSV File
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      disabled={formLoading}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border file:border-slate-200 file:text-xs file:font-bold file:bg-[#7D53F6]/10 file:text-[#7D53F6] hover:file:bg-[#7D53F6]/20 file:cursor-pointer transition-all duration-150"
                    />
                  </div>
                </div>

                {/* Preview excel sheet */}
                {bulkUsers.length > 0 && (
                  <div className="space-y-2 flex-grow flex flex-col min-h-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Upload size={13} />
                        File Preview ({bulkUsers.length} records)
                      </span>
                      <button
                        type="button"
                        onClick={() => setBulkUsers([])}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Clear File
                      </button>
                    </div>
                    
                    <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-48 overflow-y-auto bg-white flex-grow shadow-2xs">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider sticky top-0 z-10">
                          <tr>
                            <th className="p-2 pl-3">Name</th>
                            <th className="p-2">Email ID</th>
                            <th className="p-2">Role</th>
                            <th className="p-2 pr-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-600 font-sans">
                          {bulkUsers.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-2 pl-3 truncate max-w-[100px]" title={row.name}>{row.name}</td>
                              <td className="p-2 truncate max-w-[140px]" title={row.emailid}>{row.emailid}</td>
                              <td className="p-2 capitalize">{row.role}</td>
                              <td className="p-2 pr-3">
                                {row.progress === 'uploading' ? (
                                  <span className="text-[#7D53F6] font-bold animate-pulse">Uploading...</span>
                                ) : row.progress === 'success' ? (
                                  <span className="text-emerald-600 font-bold">Success</span>
                                ) : row.progress === 'error' ? (
                                  <span className="text-rose-600 font-bold" title={row.message}>Failed</span>
                                ) : row.status === 'error' ? (
                                  <span className="text-rose-500 font-semibold" title={row.message}>Invalid</span>
                                ) : (
                                  <span className="text-slate-400 font-semibold">Ready</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex gap-3 flex-shrink-0 mt-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    disabled={formLoading}
                    className="flex-grow py-3 border border-slate-200 text-slate-500 font-extrabold text-xs tracking-wider uppercase rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors focus:outline-none disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkSubmit}
                    disabled={formLoading || bulkUsers.filter(u => u.status === 'ready').length === 0}
                    className="flex-grow py-3 bg-[#7D53F6] hover:bg-[#683cdb] text-white font-extrabold text-xs tracking-wider uppercase rounded-2xl cursor-pointer shadow-md shadow-[#7D53F6]/15 hover:shadow-[#7D53F6]/25 transition-all duration-200 focus:outline-none disabled:bg-[#7D53F6]/60 flex items-center justify-center gap-1.5"
                  >
                    {formLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      <>
                        <Play size={13} />
                        <span>Upload Users</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
