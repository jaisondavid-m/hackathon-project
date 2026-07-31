import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Users, ShieldAlert, Award, GraduationCap, AlertCircle, CheckCircle, 
  Mail, Key, Settings, Calendar, Save, Clock, ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import { authService } from '../api/auth';
import { configService } from '../api/config';
import InputField from '../components/InputField';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'config'

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

  // Configuration States
  const [hours, setHours] = useState([]);
  const [hoursLoading, setHoursLoading] = useState(false);
  const [hoursSuccess, setHoursSuccess] = useState('');
  const [hoursError, setHoursError] = useState('');

  // Holiday States
  const [holidays, setHolidays] = useState([]);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [holidayFormData, setHolidayFormData] = useState({
    is_holiday: true,
    name: '',
  });
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [holidaySuccess, setHolidaySuccess] = useState('');
  const [holidayError, setHolidayError] = useState('');

  // Load Configurations on Mount / Tab Switch
  useEffect(() => {
    fetchConfigs();
  }, [activeTab]);

  const fetchConfigs = async () => {
    if (activeTab === 'config') {
      try {
        setHoursLoading(true);
        const hoursData = await configService.getHourConfigs();
        setHours(hoursData);
      } catch (err) {
        setHoursError('Failed to load hour configurations.');
      } finally {
        setHoursLoading(false);
      }

      try {
        const holidaysData = await configService.getHolidays();
        setHolidays(holidaysData);
      } catch (err) {
        console.error('Failed to load holidays:', err);
      }
    }
  };

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

  // Hour Handlers
  const handleHourTimeChange = (index, field, value) => {
    setHours((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    );
    if (hoursSuccess) setHoursSuccess('');
    if (hoursError) setHoursError('');
  };

  const handleHoursSubmit = async (e) => {
    e.preventDefault();
    setHoursSuccess('');
    setHoursError('');
    setHoursLoading(true);

    try {
      await configService.saveHourConfigs(hours);
      setHoursSuccess('All 7 hour configurations saved successfully!');
    } catch (err) {
      setHoursError('Failed to save hour configurations.');
    } finally {
      setHoursLoading(false);
    }
  };

  // Calendar Helpers & Handlers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
  };

  const changeMonth = (offset) => {
    setCurrentMonthDate(
      new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + offset, 1)
    );
    setSelectedCalendarDate(null);
    setHolidaySuccess('');
    setHolidayError('');
  };

  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getHolidayConfig = (dateStr) => {
    return holidays.find((h) => h.date === dateStr);
  };

  const handleCalendarDayClick = (date) => {
    setSelectedCalendarDate(date);
    const dateStr = formatDateString(date);
    const existingConfig = getHolidayConfig(dateStr);

    if (existingConfig) {
      setHolidayFormData({
        is_holiday: existingConfig.is_holiday,
        name: existingConfig.name,
      });
    } else {
      // Default: Sundays are holidays, others are working
      const isSunday = date.getDay() === 0;
      setHolidayFormData({
        is_holiday: isSunday,
        name: isSunday ? 'Sunday - Default Holiday' : '',
      });
    }
    setHolidaySuccess('');
    setHolidayError('');
  };

  const handleHolidaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedCalendarDate) return;

    setHolidaySuccess('');
    setHolidayError('');
    setHolidayLoading(true);

    const dateStr = formatDateString(selectedCalendarDate);

    try {
      const savedOverride = await configService.saveHoliday({
        date: dateStr,
        name: holidayFormData.name,
        is_holiday: holidayFormData.is_holiday,
      });

      setHolidaySuccess('Calendar override applied successfully!');

      // Update local holiday state
      setHolidays((prev) => {
        const filtered = prev.filter((h) => h.date !== dateStr);
        return [...filtered, savedOverride];
      });
    } catch (err) {
      setHolidayError('Failed to apply calendar override.');
    } finally {
      setHolidayLoading(false);
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

  // Render Calendar Month Grid
  const daysInMonth = getDaysInMonth(currentMonthDate);
  const firstDayIndex = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1).getDay();
  const emptyDaysBefore = Array.from({ length: firstDayIndex });
  const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tab Switcher Headers */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Console</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Manage student & faculty accounts and configure daily schedules and holidays.
          </p>
        </div>

        <div className="flex bg-[#EEF1F9] p-1.5 rounded-2xl border border-slate-100">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold tracking-wider uppercase rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-[#7D53F6] shadow-sm'
                : 'text-slate-500 hover:text-[#7D53F6]'
            }`}
          >
            <Users size={16} />
            <span>Accounts</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold tracking-wider uppercase rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === 'config'
                ? 'bg-white text-[#7D53F6] shadow-sm'
                : 'text-slate-500 hover:text-[#7D53F6]'
            }`}
          >
            <Settings size={16} />
            <span>Configurations</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: USER ACCOUNTS */}
      {activeTab === 'users' && (
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

              {/* Notifications */}
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
      )}

      {/* VIEW 2: SYSTEM CONFIGURATIONS */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          {/* Left Side: Daily Class Hours Settings */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl">
                  <Clock size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Daily Hours Config</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Configure Start/End times for 7 slots
                  </p>
                </div>
              </div>

              {/* Notifications */}
              {hoursError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                  <AlertCircle size={16} />
                  <span>{hoursError}</span>
                </div>
              )}

              {hoursSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-semibold animate-pulse">
                  <CheckCircle size={16} />
                  <span>{hoursSuccess}</span>
                </div>
              )}

              <form onSubmit={handleHoursSubmit} className="space-y-4">
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {hours.map((h, i) => (
                    <div
                      key={h.id || h.hour_number}
                      className="flex items-center gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-2xl"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#7D53F6]/10 text-[#7D53F6] font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                        H{h.hour_number}
                      </div>

                      <div className="grid grid-cols-2 gap-2 flex-grow">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">
                            Start Time
                          </label>
                          <input
                            type="text"
                            value={h.start_time}
                            onChange={(e) => handleHourTimeChange(i, 'start_time', e.target.value)}
                            placeholder="e.g. 09:00 AM"
                            required
                            disabled={hoursLoading}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-lg focus:outline-none focus:border-[#7D53F6] focus:ring-1 focus:ring-[#7D53F6]/20 transition-all duration-150"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">
                            End Time
                          </label>
                          <input
                            type="text"
                            value={h.end_time}
                            onChange={(e) => handleHourTimeChange(i, 'end_time', e.target.value)}
                            placeholder="e.g. 10:00 AM"
                            required
                            disabled={hoursLoading}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-lg focus:outline-none focus:border-[#7D53F6] focus:ring-1 focus:ring-[#7D53F6]/20 transition-all duration-150"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={hoursLoading || hours.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#7D53F6] hover:bg-[#683cdb] text-white text-sm font-bold rounded-xl shadow-md shadow-[#7D53F6]/20 transition-all duration-200 cursor-pointer disabled:bg-[#7D53F6]/60"
                >
                  <Save size={16} />
                  <span>Save Timeslots</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Side: Calendar Holiday Overrides */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Monthly Calendar Grid */}
            <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 md:col-span-7">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                  {monthName}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Calendar Grid Cells */}
              <div className="grid grid-cols-7 gap-1">
                {emptyDaysBefore.map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square" />
                ))}

                {daysInMonth.map((day) => {
                  const dateStr = formatDateString(day);
                  const existingConfig = getHolidayConfig(dateStr);
                  const isSelected = selectedCalendarDate && formatDateString(selectedCalendarDate) === dateStr;

                  // Default Sundays to holiday
                  const isSunday = day.getDay() === 0;
                  
                  let cellBg = 'bg-slate-50/50 border-slate-100 text-slate-700';
                  let statusDot = null;

                  if (existingConfig) {
                    if (existingConfig.is_holiday) {
                      cellBg = 'bg-rose-50 border-rose-100 text-rose-700 font-extrabold shadow-sm';
                      statusDot = <span className="absolute bottom-1 w-1 h-1 rounded-full bg-rose-500" />;
                    } else {
                      cellBg = 'bg-emerald-50 border-emerald-100 text-emerald-700 font-extrabold shadow-sm';
                      statusDot = <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />;
                    }
                  } else if (isSunday) {
                    // Default Sunday
                    cellBg = 'bg-rose-50/30 border-rose-50 text-rose-500/80 font-bold';
                  }

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleCalendarDayClick(day)}
                      className={`aspect-square border rounded-xl flex flex-col items-center justify-center text-xs relative cursor-pointer hover:border-[#7D53F6] hover:scale-105 transition-all duration-150 ${cellBg} ${
                        isSelected ? 'border-2 border-[#7D53F6] ring-2 ring-[#7D53F6]/10 scale-105 font-black z-10' : ''
                      }`}
                    >
                      <span>{day.getDate()}</span>
                      {statusDot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Status Panel */}
            <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6 md:col-span-5">
              <h3 className="text-sm font-extrabold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Calendar size={16} className="text-[#7D53F6]" />
                Day Override
              </h3>

              {selectedCalendarDate ? (
                <form onSubmit={handleHolidaySubmit} className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Selected Date</span>
                    <span className="text-xs font-bold text-slate-700 mt-0.5 block">
                      {selectedCalendarDate.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                      Calendar Status
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setHolidayFormData(prev => ({ ...prev, is_holiday: true }))}
                        className={`py-1.5 text-[10px] font-extrabold uppercase rounded-lg border text-center cursor-pointer transition-colors ${
                          holidayFormData.is_holiday
                            ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        Holiday
                      </button>
                      <button
                        type="button"
                        onClick={() => setHolidayFormData(prev => ({ ...prev, is_holiday: false }))}
                        className={`py-1.5 text-[10px] font-extrabold uppercase rounded-lg border text-center cursor-pointer transition-colors ${
                          !holidayFormData.is_holiday
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        Working Day
                      </button>
                    </div>
                  </div>

                  <InputField
                    label="Reason / Label"
                    value={holidayFormData.name}
                    onChange={(e) => setHolidayFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Independence Day"
                    required={holidayFormData.is_holiday}
                    disabled={holidayLoading}
                  />

                  {holidayError && (
                    <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-[10px] font-bold flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      <span>{holidayError}</span>
                    </div>
                  )}

                  {holidaySuccess && (
                    <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-[10px] font-bold flex items-center gap-1.5">
                      <CheckCircle size={14} />
                      <span>{holidaySuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={holidayLoading}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-[#7D53F6] hover:bg-[#683cdb] text-white text-xs font-bold rounded-lg shadow-sm transition-colors duration-200 cursor-pointer disabled:bg-[#7D53F6]/60"
                  >
                    {holidayLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Apply Override</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-10 text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Info size={24} className="text-slate-300" />
                  <p className="text-[10px] font-semibold tracking-wider uppercase leading-snug px-4">
                    Click any day in the calendar grid to configure holidays or working overrides.
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

export default AdminDashboard;
