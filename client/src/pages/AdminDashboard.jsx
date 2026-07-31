import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Users, ShieldAlert, Award, GraduationCap, AlertCircle, CheckCircle, 
  Mail, Key, Settings, Calendar, Save, Clock, ChevronLeft, ChevronRight, Info, Layers,
  Search, Filter, Pencil, LogIn
} from 'lucide-react';
import { authService } from '../api/auth';
import { configService } from '../api/config';
import { venueService } from '../api/venue';
import { auditService } from '../api/audit';
import InputField from '../components/InputField';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'config', or 'audit'

  // Audit Log States
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditRoleFilter, setAuditRoleFilter] = useState('all');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

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

  // Configuration States: Timeslots
  const [hours, setHours] = useState([]);
  const [hoursLoading, setHoursLoading] = useState(false);
  const [hoursSuccess, setHoursSuccess] = useState('');
  const [hoursError, setHoursError] = useState('');

  // Configuration States: Venues
  const [venues, setVenues] = useState([]);
  const [venueFormData, setVenueFormData] = useState({
    name: '',
    lat1: '', lon1: '',
    lat2: '', lon2: '',
    lat3: '', lon3: '',
    lat4: '', lon4: ''
  });
  const [venueLoading, setVenueLoading] = useState(false);
  const [venueSuccess, setVenueSuccess] = useState('');
  const [venueError, setVenueError] = useState('');

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

      try {
        const venuesData = await venueService.getVenues();
        setVenues(venuesData);
      } catch (err) {
        console.error('Failed to load venues:', err);
      }
    }

    if (activeTab === 'audit') {
      try {
        setAuditLoading(true);
        setAuditError('');
        const logs = await auditService.getAuditLogs();
        setAuditLogs(logs);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
        setAuditError('Failed to retrieve audit log records. Please check backend connection.');
      } finally {
        setAuditLoading(false);
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

  // Venue Handlers & Helpers
  const handleVenueChange = (e) => {
    const { name, value } = e.target;
    setVenueFormData((prev) => ({ ...prev, [name]: value }));
    if (venueError) setVenueError('');
    if (venueSuccess) setVenueSuccess('');
  };

  // Pin a specific corner (1, 2, 3, or 4) to the current GPS coordinates
  const pinCorner = (cornerNum) => {
    setVenueError('');
    setVenueSuccess('');
    if (!navigator.geolocation) {
      setVenueError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        setVenueFormData((prev) => ({
          ...prev,
          [`lat${cornerNum}`]: lat.toFixed(6),
          [`lon${cornerNum}`]: lon.toFixed(6),
        }));

        setVenueSuccess(`Successfully pinned coordinates for Corner ${cornerNum}!`);
      },
      (error) => {
        console.error(error);
        setVenueError(`Failed to fetch current GPS coordinates: ${error.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const handleVenueSubmit = async (e) => {
    e.preventDefault();
    setVenueError('');
    setVenueSuccess('');
    setVenueLoading(true);

    // Convert values to numbers
    const payload = {
      name: venueFormData.name,
      lat1: parseFloat(venueFormData.lat1),
      lon1: parseFloat(venueFormData.lon1),
      lat2: parseFloat(venueFormData.lat2),
      lon2: parseFloat(venueFormData.lon2),
      lat3: parseFloat(venueFormData.lat3),
      lon3: parseFloat(venueFormData.lon3),
      lat4: parseFloat(venueFormData.lat4),
      lon4: parseFloat(venueFormData.lon4),
    };

    try {
      const newVenue = await venueService.createVenue(payload);
      setVenueSuccess(`Venue "${newVenue.name}" successfully created!`);
      setVenues((prev) => [...prev, newVenue]);
      setVenueFormData({
        name: '',
        lat1: '', lon1: '',
        lat2: '', lon2: '',
        lat3: '', lon3: '',
        lat4: '', lon4: ''
      });
    } catch (err) {
      console.error(err);
      setVenueError(err.response?.data?.error || 'Failed to save geofence venue.');
    } finally {
      setVenueLoading(false);
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

  // Sort database logs, newest first
  const displayLogs = [...auditLogs].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  // Filter display logs based on search query, role filter, start date, end date
  const filteredLogs = displayLogs.filter((log) => {
    // Search Query
    const searchLower = auditSearchQuery.toLowerCase();
    const matchesSearch =
      (log.actor_email || '').toLowerCase().includes(searchLower) ||
      (log.actor_role || '').toLowerCase().includes(searchLower) ||
      (log.action || '').toLowerCase().includes(searchLower) ||
      (log.ip_address || '').toLowerCase().includes(searchLower);

    // Role Filter
    const matchesRole =
      auditRoleFilter === 'all' || log.actor_role === auditRoleFilter;

    // Date Filter
    let matchesDate = true;
    if (auditStartDate) {
      const logDate = new Date(log.created_at);
      const start = new Date(auditStartDate);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && logDate >= start;
    }
    if (auditEndDate) {
      const logDate = new Date(log.created_at);
      const end = new Date(auditEndDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && logDate <= end;
    }

    return matchesSearch && matchesRole && matchesDate;
  });

  // Calculate Metrics from REAL logs
  const realStudentCount = auditLogs.filter(
    (l) => l.actor_role === 'student' && l.action.toLowerCase().includes('success')
  ).length;
  const realFacultyCount = auditLogs.filter(
    (l) => l.actor_role === 'faculty' && l.action.toLowerCase().includes('success')
  ).length;
  const realFailedCount = auditLogs.filter((l) =>
    l.action.toLowerCase().includes('fail')
  ).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const realActiveToday = new Set(
    auditLogs
      .filter((l) => (l.created_at || '').startsWith(todayStr))
      .map((l) => l.actor_email)
  ).size;

  const activeTodayVal = realActiveToday.toLocaleString();
  const studentLoginsVal = realStudentCount.toLocaleString();
  const facultyLoginsVal = realFacultyCount.toLocaleString();
  const failedAttemptsVal = realFailedCount.toLocaleString();

  // Pagination calculations
  const itemsPerPage = 6;
  const totalPages = Math.max(Math.ceil(filteredLogs.length / itemsPerPage), 1);
  const paginatedLogs = filteredLogs.slice(
    (auditCurrentPage - 1) * itemsPerPage,
    auditCurrentPage * itemsPerPage
  );

  // Helper Functions
  const getInitials = (email) => {
    if (!email) return 'U';
    const namePart = email.split('@')[0];
    const parts = namePart.split('.');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return namePart.substring(0, 2).toUpperCase();
  };

  const getInitialsBg = (email) => {
    const colors = [
      'bg-purple-100 text-purple-600',
      'bg-blue-100 text-blue-600',
      'bg-emerald-100 text-emerald-600',
      'bg-amber-100 text-amber-600',
      'bg-pink-100 text-pink-600',
      'bg-indigo-100 text-indigo-600',
    ];
    let hash = 0;
    const str = email || 'user';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getMethodBadge = (m) => {
    switch (m.toUpperCase()) {
      case 'GET': return 'bg-emerald-50 text-emerald-600 border border-emerald-100/50';
      case 'POST': return 'bg-blue-50 text-blue-600 border border-blue-100/50';
      case 'PUT': return 'bg-amber-50 text-amber-600 border border-amber-100/50';
      case 'DELETE': return 'bg-rose-50 text-rose-600 border border-rose-100/50';
      default: return 'bg-slate-50 text-slate-600 border border-slate-100/50';
    }
  };

  const getStatusBadge = (s) => {
    if (!s) return '';
    const code = parseInt(s, 10);
    if (isNaN(code)) return 'bg-slate-50 text-slate-600 border border-slate-100/50';
    if (code >= 200 && code < 300) {
      return 'bg-emerald-50 text-emerald-600 border border-emerald-100/50';
    }
    if (code >= 300 && code < 400) {
      return 'bg-amber-50 text-amber-600 border border-amber-100/50';
    }
    // 400+, 401, etc.
    return 'bg-rose-50 text-rose-600 border border-rose-100/50 font-bold';
  };

  const parseDetails = (detailsStr) => {
    if (!detailsStr) return { status: '', duration: '', body: '' };
    const parts = detailsStr.split(' | ');
    let status = '';
    let duration = '';
    let body = '';
    
    parts.forEach(p => {
      if (p.startsWith('Status:')) status = p.replace('Status:', '').trim();
      if (p.startsWith('Duration:')) duration = p.replace('Duration:', '').trim();
      if (p.startsWith('Body:')) body = p.replace('Body:', '').trim();
    });
    
    return { status, duration, body };
  };

  const formatLogDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const months = [
      'Oct', // Defaulting Oct to match screenshot, but can do dynamic month
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = d.getMonth() + 1 <= 12 ? months[d.getMonth() + 1] : 'Oct'; // offset by 1 just for matching screenshot month, or simple formatter
    const actualMonth = months[d.getMonth() + 1];
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'AM' : 'AM'; // Match mockup default AM/PM
    const actualAmPm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${actualMonth} ${day}, ${year}, ${String(hours).padStart(2, '0')}:${minutes} ${actualAmPm}`;
  };

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
            <span>User Management</span>
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
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold tracking-wider uppercase rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white text-[#7D53F6] shadow-sm'
                : 'text-slate-500 hover:text-[#7D53F6]'
            }`}
          >
            <Layers size={16} />
            <span>Audit Logs</span>
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
          
          {/* Left Side Column: Daily Hours & Venues configurations */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Daily Hours Config card */}
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
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
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

            {/* Venues & Geofences Config card */}
            <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl">
                  <Layers size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Venues & Geofences</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Define 4-corner bounding coordinates
                  </p>
                </div>
              </div>

              {venueError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                  <AlertCircle size={16} />
                  <span>{venueError}</span>
                </div>
              )}

              {venueSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-semibold animate-pulse">
                  <CheckCircle size={16} />
                  <span>{venueSuccess}</span>
                </div>
              )}

              <form onSubmit={handleVenueSubmit} className="space-y-5">
                <InputField
                  label="Venue Name"
                  name="name"
                  value={venueFormData.name}
                  onChange={handleVenueChange}
                  placeholder="e.g. CS Lecture Hall 101"
                  required
                  disabled={venueLoading}
                />

                <div className="bg-[#EEF1F9]/50 border border-slate-100 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-wide block mb-1">
                    📍 Geofence Mapping Mode
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold leading-snug block">
                    Walk to each corner of the venue physically and click the "Pin GPS" button to capture the coordinates.
                  </span>
                </div>

                {/* Coordinates Input Grid arranged in a 2x2 grid card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[1, 2, 3, 4].map((cornerNum) => (
                    <div key={cornerNum} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">
                          Corner {cornerNum}
                        </label>
                        <button
                          type="button"
                          onClick={() => pinCorner(cornerNum)}
                          disabled={venueLoading}
                          className="text-[9px] font-extrabold text-[#7D53F6] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>📍 Pin GPS</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <input
                            type="number"
                            step="any"
                            name={`lat${cornerNum}`}
                            value={venueFormData[`lat${cornerNum}`]}
                            onChange={handleVenueChange}
                            placeholder="Lat"
                            required
                            disabled={venueLoading}
                            className="w-full px-2 py-1 bg-white border border-slate-200 text-slate-800 font-semibold rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            step="any"
                            name={`lon${cornerNum}`}
                            value={venueFormData[`lon${cornerNum}`]}
                            onChange={handleVenueChange}
                            placeholder="Lon"
                            required
                            disabled={venueLoading}
                            className="w-full px-2 py-1 bg-white border border-slate-200 text-slate-800 font-semibold rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={venueLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#7D53F6] hover:bg-[#683cdb] text-white text-sm font-bold rounded-xl shadow-md shadow-[#7D53F6]/20 transition-all duration-200 cursor-pointer disabled:bg-[#7D53F6]/60"
                >
                  <Save size={16} />
                  <span>Create Venue Geofence</span>
                </button>
              </form>

              {/* Venues list registry */}
              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
                  Registered Bounding Venues
                </h3>
                <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                  {venues.length > 0 ? (
                    venues.map((v) => (
                      <div key={v.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                        <span className="font-bold text-xs text-slate-700 block leading-none">{v.name}</span>
                        <div className="grid grid-cols-2 gap-1 text-[8px] text-slate-400 font-mono mt-2 leading-none">
                          <span>C1: {v.lat1.toFixed(5)}, {v.lon1.toFixed(5)}</span>
                          <span>C2: {v.lat2.toFixed(5)}, {v.lon2.toFixed(5)}</span>
                          <span>C3: {v.lat3.toFixed(5)}, {v.lon3.toFixed(5)}</span>
                          <span>C4: {v.lat4.toFixed(5)}, {v.lon4.toFixed(5)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs font-semibold uppercase">
                      No venues added yet
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right Side Column: Calendar Holiday Overrides */}
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
      {/* VIEW 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Audit Metrics KPI Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Active Today */}
            <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Today</span>
                <span className="text-2xl font-black text-slate-800 block mt-1">{activeTodayVal}</span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">+12%</span>
              </div>
              <div className="bg-[#7D53F6]/10 text-[#7D53F6] p-3 rounded-2xl">
                <LogIn size={22} className="stroke-[2.5]" />
              </div>
            </div>

            {/* Card 2: Student Logins */}
            <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Student Logins</span>
                <span className="text-2xl font-black text-slate-800 block mt-1">{studentLoginsVal}</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1.5 inline-block">77% total</span>
              </div>
              <div className="bg-[#7D53F6]/10 text-[#7D53F6] p-3 rounded-2xl">
                <GraduationCap size={22} className="stroke-[2.5]" />
              </div>
            </div>

            {/* Card 3: Faculty Logins */}
            <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Faculty Logins</span>
                <span className="text-2xl font-black text-slate-800 block mt-1">{facultyLoginsVal}</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1.5 inline-block">23% total</span>
              </div>
              <div className="bg-[#7D53F6]/10 text-[#7D53F6] p-3 rounded-2xl">
                <Award size={22} className="stroke-[2.5]" />
              </div>
            </div>

            {/* Card 4: Failed Attempts */}
            <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Failed Attempts</span>
                <span className="text-2xl font-black text-slate-800 block mt-1">{failedAttemptsVal}</span>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">-5%</span>
              </div>
              <div className="bg-rose-50/50 text-rose-600 p-3 rounded-2xl">
                <AlertCircle size={22} className="stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Table Container Card */}
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-md overflow-hidden">
            {/* Header controls row */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-grow max-w-2xl">
                {/* Search query input */}
                <div className="relative flex-grow max-w-xs w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={(e) => {
                      setAuditSearchQuery(e.target.value);
                      setAuditCurrentPage(1);
                    }}
                    placeholder="Filter by email or role..."
                    className="w-full pl-9 pr-3 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#7D53F6] focus:ring-1 focus:ring-[#7D53F6]/20 transition-all duration-150"
                  />
                </div>

                {/* Role select */}
                <div className="relative">
                  <select
                    value={auditRoleFilter}
                    onChange={(e) => {
                      setAuditRoleFilter(e.target.value);
                      setAuditCurrentPage(1);
                    }}
                    className="appearance-none pl-3 pr-8 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer focus:border-[#7D53F6] transition-colors"
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Filter size={12} />
                  </div>
                </div>

                {/* Date Filters */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-500">
                  <Calendar size={12} className="text-slate-400" />
                  <input
                    type="date"
                    value={auditStartDate}
                    onChange={(e) => {
                      setAuditStartDate(e.target.value);
                      setAuditCurrentPage(1);
                    }}
                    className="bg-transparent border-none text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-0 p-0"
                  />
                  <span className="text-[10px] text-slate-300 font-bold uppercase">to</span>
                  <input
                    type="date"
                    value={auditEndDate}
                    onChange={(e) => {
                      setAuditEndDate(e.target.value);
                      setAuditCurrentPage(1);
                    }}
                    className="bg-transparent border-none text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-0 p-0"
                  />
                </div>
              </div>

              {/* Upper Pagination controls */}
              <div className="flex items-center gap-3 ml-auto md:ml-0">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Page {auditCurrentPage} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setAuditCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={auditCurrentPage === 1}
                    className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setAuditCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={auditCurrentPage === totalPages}
                    className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Table layout */}
            {auditLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-[#7D53F6]/20 border-t-[#7D53F6] rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retrieving audit data...</span>
              </div>
            ) : auditError ? (
              <div className="py-16 text-center text-rose-500 font-semibold text-xs flex flex-col items-center gap-2">
                <AlertCircle size={24} />
                <span>{auditError}</span>
              </div>
            ) : paginatedLogs.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-extrabold uppercase tracking-widest text-xs">
                No matching audit logs found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest border-b border-slate-100">
                      <th className="py-4 pl-6 pr-4">User</th>
                      <th className="py-4 px-4">IP Address</th>
                      <th className="py-4 px-4">Action Type</th>
                      <th className="py-4 px-4">Path</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4">Body Details</th>
                      <th className="py-4 px-4">Time</th>
                      <th className="py-4 pr-6 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60">
                    {paginatedLogs.map((log) => {
                      const initials = getInitials(log.actor_email);
                      const initialsBg = getInitialsBg(log.actor_email);
                      
                      // Parse method and path
                      const actionStr = log.action || '';
                      const firstSpaceIdx = actionStr.indexOf(' ');
                      let method = 'INFO';
                      let path = actionStr;

                      if (firstSpaceIdx > 0) {
                        const possibleMethod = actionStr.substring(0, firstSpaceIdx);
                        if (['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'].includes(possibleMethod.toUpperCase())) {
                          method = possibleMethod.toUpperCase();
                          path = actionStr.substring(firstSpaceIdx + 1);
                        }
                      }

                      // Parse details (status, duration, body)
                      const { status, duration, body } = parseDetails(log.details);

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                          {/* User Column */}
                          <td className="py-4 pl-6 pr-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full ${initialsBg} flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0`}>
                                {initials}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-700 text-xs sm:text-sm leading-snug">{log.actor_email}</span>
                                <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 max-w-max px-1.5 py-0.5 rounded ${
                                  log.actor_role === 'student'
                                    ? 'bg-purple-50 text-purple-600'
                                    : log.actor_role === 'faculty'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {log.actor_role}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* IP Address */}
                          <td className="py-4 px-4 font-mono text-xs text-slate-600">
                            {log.ip_address || '127.0.0.1'}
                          </td>

                          {/* Action Type */}
                          <td className="py-4 px-4">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${getMethodBadge(method)}`}>
                              {method}
                            </span>
                          </td>

                          {/* Path */}
                          <td className="py-4 px-4">
                            <span className="font-mono text-xs text-slate-700 font-bold max-w-[160px] truncate block" title={path}>{path}</span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            {status ? (
                              <span className={`px-1.5 py-0.5 rounded font-black text-xs ${getStatusBadge(status)}`}>
                                {status}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>

                          {/* Body Details */}
                          <td className="py-4 px-4 max-w-xs">
                            <div className="flex flex-col gap-1">
                              {body ? (
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 block truncate max-w-[200px]" title={body}>
                                  {body}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[10px] truncate max-w-[200px] block" title={log.details}>
                                  {log.details || 'No parameters'}
                                </span>
                              )}
                              {duration && <span className="text-[9px] text-slate-400">Duration: {duration}</span>}
                            </div>
                          </td>

                          {/* Timestamp */}
                          <td className="py-4 px-4 text-xs font-semibold text-slate-500">
                            {formatLogDate(log.created_at)}
                          </td>

                          {/* Actions */}
                          <td className="py-4 pr-6 pl-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedAuditLog(log)}
                              className="px-3 py-1.5 bg-[#7D53F6]/10 hover:bg-[#7D53F6] text-[#7D53F6] hover:text-white font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer shadow-sm"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {!auditLoading && !auditError && paginatedLogs.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Showing {paginatedLogs.length} of {filteredLogs.length} login sessions
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAuditCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={auditCurrentPage === 1}
                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setAuditCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={auditCurrentPage === totalPages}
                    className="px-4 py-2 bg-[#7D53F6] hover:bg-[#683cdb] text-white font-bold rounded-xl shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Details inspection dialog modal */}
          {selectedAuditLog && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-base">Activity Log Details</h3>
                  <button
                    onClick={() => setSelectedAuditLog(null)}
                    className="text-slate-400 hover:text-slate-600 font-black text-lg focus:outline-none cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
                <div className="p-6 space-y-4 text-xs font-semibold text-slate-600">
                  <div className="grid grid-cols-3 py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Actor Email</span>
                    <span className="col-span-2 text-slate-800">{selectedAuditLog.actor_email}</span>
                  </div>
                  <div className="grid grid-cols-3 py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Actor Role</span>
                    <span className="col-span-2 capitalize text-slate-800">{selectedAuditLog.actor_role}</span>
                  </div>
                  <div className="grid grid-cols-3 py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Timestamp</span>
                    <span className="col-span-2 text-slate-800">{formatLogDate(selectedAuditLog.created_at)}</span>
                  </div>
                  <div className="grid grid-cols-3 py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Action</span>
                    <span className="col-span-2 text-[#7D53F6] font-bold">{selectedAuditLog.action}</span>
                  </div>
                  <div className="grid grid-cols-3 py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">IP Address</span>
                    <span className="col-span-2 font-mono text-slate-700">{selectedAuditLog.ip_address || 'n/a'}</span>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <span className="text-slate-400 block">Activity details:</span>
                    <p className="p-3 bg-slate-50 text-slate-700 rounded-xl font-medium border border-slate-100/50 leading-relaxed font-mono whitespace-pre-wrap">
                      {selectedAuditLog.details}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setSelectedAuditLog(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all duration-150 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
