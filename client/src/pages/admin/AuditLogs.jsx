import React, { useState, useEffect, useMemo } from 'react';
import { 
  LogIn, GraduationCap, Award, AlertCircle, Search, Filter, Calendar, ChevronLeft, ChevronRight, RefreshCw 
} from 'lucide-react';
import { auditService } from '../../api/audit';

function AuditLogs() {
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

  // Load Audit Logs on Mount
  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async (force = false) => {
    try {
      setAuditLoading(true);
      setAuditError('');
      const logs = await auditService.getAuditLogs(force);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setAuditError('Failed to retrieve audit log records. Please check backend connection.');
    } finally {
      setAuditLoading(false);
    }
  };

  // Sort database logs, newest first (memoized)
  const displayLogs = useMemo(() => {
    return [...auditLogs].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }, [auditLogs]);

  // Filter display logs based on search query, role filter, start date, end date (memoized)
  const filteredLogs = useMemo(() => {
    return displayLogs.filter((log) => {
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
  }, [displayLogs, auditSearchQuery, auditRoleFilter, auditStartDate, auditEndDate]);

  // Calculate Metrics from REAL logs (memoized)
  const metrics = useMemo(() => {
    const studentCount = auditLogs.filter(
      (l) => l.actor_role === 'student' && l.action.toLowerCase().includes('success')
    ).length;
    const facultyCount = auditLogs.filter(
      (l) => l.actor_role === 'faculty' && l.action.toLowerCase().includes('success')
    ).length;
    const failedCount = auditLogs.filter((l) =>
      l.action.toLowerCase().includes('fail')
    ).length;

    const todayStr = new Date().toISOString().split('T')[0];
    const activeToday = new Set(
      auditLogs
        .filter((l) => (l.created_at || '').startsWith(todayStr))
        .map((l) => l.actor_email)
    ).size;

    return {
      activeTodayVal: activeToday.toLocaleString(),
      studentLoginsVal: studentCount.toLocaleString(),
      facultyLoginsVal: facultyCount.toLocaleString(),
      failedAttemptsVal: failedCount.toLocaleString(),
    };
  }, [auditLogs]);

  const { activeTodayVal, studentLoginsVal, facultyLoginsVal, failedAttemptsVal } = metrics;

  // Pagination calculations (memoized)
  const itemsPerPage = 6;
  const totalPages = useMemo(() => {
    return Math.max(Math.ceil(filteredLogs.length / itemsPerPage), 1);
  }, [filteredLogs]);

  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(
      (auditCurrentPage - 1) * itemsPerPage,
      auditCurrentPage * itemsPerPage
    );
  }, [filteredLogs, auditCurrentPage]);

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
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const actualMonth = months[d.getMonth()];
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const actualAmPm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${actualMonth} ${day}, ${year}, ${String(hours).padStart(2, '0')}:${minutes} ${actualAmPm}`;
  };

  return (
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
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-500 w-full sm:w-auto">
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
            {/* Refresh button */}
            <button
              onClick={() => fetchAuditLogs(true)}
              disabled={auditLoading}
              title="Force Refresh Logs"
              className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <RefreshCw size={14} className={auditLoading ? 'animate-spin' : ''} />
            </button>
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
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">Activity Log Details</h3>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="text-slate-400 hover:text-slate-600 font-black text-lg focus:outline-none cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs font-semibold text-slate-600 overflow-y-auto flex-grow">
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
  );
}

export default AuditLogs;
