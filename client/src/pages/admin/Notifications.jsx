import React, { useState, useEffect } from 'react';
import { 
  Bell, Send, Mail, Users, AlertCircle, CheckCircle, Trash2, ShieldAlert, Award, GraduationCap, X, Search 
} from 'lucide-react';
import { authService } from '../../api/auth';
import InputField from '../../components/InputField';

function Notifications() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sentNotifications, setSentNotifications] = useState([]);
  
  // Form states
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info'); // info | warning | error | success
  const [targetScope, setTargetScope] = useState('all'); // all | faculty | student | user
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    loadSentNotifications();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await authService.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load system users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadSentNotifications = () => {
    try {
      const stored = localStorage.getItem('pcdp_notifications');
      if (stored) {
        setSentNotifications(JSON.parse(stored));
      } else {
        // Prepopulate with defaults if empty
        const initial = [
          {
            id: 'notif-1',
            title: 'Security Alert',
            message: 'Unauthorized activity has been detected. Please review the Audit Logs page to investigate and monitor the issue.',
            type: 'warning',
            target: 'admin',
            targetEmail: '',
            createdAt: new Date().toISOString()
          },
          {
            id: 'notif-2',
            title: 'Meeting Reminder',
            message: 'This is a reminder that you have a meeting scheduled from 11:00 AM to 11:30 AM in Seminar Hall 2.',
            type: 'info',
            target: 'faculty',
            targetEmail: '',
            createdAt: new Date().toISOString()
          },
          {
            id: 'notif-3',
            title: 'Attendance Reminder',
            message: 'Please maintain a minimum attendance of 80% to remain eligible for the semester-end examinations.',
            type: 'success',
            target: 'student',
            targetEmail: '',
            createdAt: new Date().toISOString()
          }
        ];
        localStorage.setItem('pcdp_notifications', JSON.stringify(initial));
        setSentNotifications(initial);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!title.trim() || !message.trim()) {
      setFormError('Both Title and Message fields are required.');
      return;
    }

    if (targetScope === 'user' && !selectedUserEmail) {
      setFormError('Please select a specific recipient user.');
      return;
    }

    setFormLoading(true);

    setTimeout(() => {
      try {
        const newNotif = {
          id: `notif-${Date.now()}`,
          title: title.trim(),
          message: message.trim(),
          type,
          target: targetScope,
          targetEmail: targetScope === 'user' ? selectedUserEmail : '',
          createdAt: new Date().toISOString()
        };

        const updatedList = [newNotif, ...sentNotifications];
        localStorage.setItem('pcdp_notifications', JSON.stringify(updatedList));
        setSentNotifications(updatedList);

        setFormSuccess('Notification dispatched successfully!');
        
        // Reset form details
        setTitle('');
        setMessage('');
        setType('info');
        setTargetScope('all');
        setSelectedUserEmail('');
        setUserSearchTerm('');
      } catch (err) {
        setFormError('Failed to dispatch notification.');
      } finally {
        setFormLoading(false);
      }
    }, 600);
  };

  const handleDelete = (id) => {
    try {
      const updatedList = sentNotifications.filter(n => n.id !== id);
      localStorage.setItem('pcdp_notifications', JSON.stringify(updatedList));
      setSentNotifications(updatedList);
    } catch (e) {
      console.error(e);
    }
  };

  // Filter users based on target scope and search query
  const filteredUsersForSelect = users.filter(u => {
    const term = userSearchTerm.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(term) || u.emailid.toLowerCase().includes(term);
    return matchesSearch;
  });

  const getRecipientLabel = (n) => {
    if (n.target === 'all') return 'Broadcast (Everyone)';
    if (n.target === 'faculty') return 'All Faculty Staff';
    if (n.target === 'student') return 'All Students';
    if (n.target === 'admin') return 'All Admins';
    return n.targetEmail || 'Individual User';
  };

  const getTypeBadge = (notifType) => {
    switch (notifType) {
      case 'warning':
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-extrabold uppercase rounded border border-amber-100/50">Warning</span>;
      case 'error':
        return <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-extrabold uppercase rounded border border-rose-100/50">Alert</span>;
      case 'success':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase rounded border border-emerald-100/50">Success</span>;
      default:
        return <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[9px] font-extrabold uppercase rounded border border-sky-100/50">Info</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Notification Center</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Draft messages and broadcast them directly to role groups or specific users
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-5 bg-white border border-slate-100/80 rounded-3xl p-5 sm:p-6 shadow-sm h-fit">
          <h3 className="font-extrabold text-slate-800 text-sm mb-4 uppercase tracking-wider pb-2 border-b border-slate-50 flex items-center gap-2">
            <Send size={15} className="text-[#7D53F6]" />
            Compose Message
          </h3>

          <form onSubmit={handleSend} className="space-y-4">
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

            {/* Recipient Selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Target Audience
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'Broadcast All' },
                  { id: 'faculty', label: 'All Faculty' },
                  { id: 'student', label: 'All Students' },
                  { id: 'user', label: 'Specific User' }
                ].map((scope) => (
                  <button
                    key={scope.id}
                    type="button"
                    onClick={() => setTargetScope(scope.id)}
                    className={`py-2 px-3 border text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer text-center focus:outline-none ${
                      targetScope === scope.id
                        ? 'border-[#7D53F6] bg-[#7D53F6]/5 text-[#7D53F6] font-extrabold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    {scope.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific User Select Input */}
            {targetScope === 'user' && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  Select Recipient User
                </label>
                <div className="relative">
                  <select
                    value={selectedUserEmail}
                    onChange={(e) => setSelectedUserEmail(e.target.value)}
                    className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all cursor-pointer"
                  >
                    <option value="">-- Choose target user email --</option>
                    {filteredUsersForSelect.map(u => (
                      <option key={u.id} value={u.emailid}>
                        {u.name} ({u.role.toUpperCase()}) — {u.emailid}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Search helper */}
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[10px] focus:outline-none focus:border-[#7D53F6] transition-colors"
                  />
                  <Search size={10} className="absolute right-3 text-slate-400" />
                </div>
              </div>
            )}

            {/* Notification Type/Category */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Severity Level
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'info', label: 'Info', color: 'bg-sky-500 border-sky-600' },
                  { id: 'warning', label: 'Warning', color: 'bg-amber-500 border-amber-600' },
                  { id: 'error', label: 'Alert', color: 'bg-rose-500 border-rose-600' },
                  { id: 'success', label: 'Success', color: 'bg-emerald-500 border-emerald-600' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition-all duration-150 cursor-pointer text-center focus:outline-none capitalize ${
                      type === t.id
                        ? 'border-slate-800 bg-slate-900 text-white font-extrabold'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Message Title
              </label>
              <input
                type="text"
                placeholder="e.g. Schedule Alteration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl focus:outline-none focus:border-[#7D53F6] focus:ring-4 focus:ring-[#7D53F6]/10 transition-all duration-200"
              />
            </div>

            {/* Message Body Input */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Message Body Content
              </label>
              <textarea
                placeholder="Type your message description here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl focus:outline-none focus:border-[#7D53F6] focus:ring-4 focus:ring-[#7D53F6]/10 transition-all duration-200 resize-none"
              />
            </div>

            {/* Dispatch Button */}
            <button
              type="submit"
              disabled={formLoading}
              className="w-full py-3 bg-[#7D53F6] hover:bg-[#683cdb] text-white font-extrabold text-xs tracking-wider uppercase rounded-2xl cursor-pointer shadow-md shadow-[#7D53F6]/15 hover:shadow-[#7D53F6]/25 transition-all duration-200 focus:outline-none disabled:bg-[#7D53F6]/60 flex justify-center items-center gap-2"
            >
              {formLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={13} />
                  <span>Send Notification</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sent History Column */}
        <div className="lg:col-span-7 bg-white border border-slate-100/80 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col min-h-[480px]">
          <div className="mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Bell size={15} className="text-[#7D53F6]" />
              Dispatched History ({sentNotifications.length})
            </h3>
          </div>

          {/* List container */}
          <div className="space-y-3.5 overflow-y-auto flex-grow max-h-[500px] pr-1">
            {sentNotifications.length > 0 ? (
              sentNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  className="p-4 bg-slate-50/50 border border-slate-100 hover:border-slate-200/80 rounded-2xl transition-all duration-150 flex flex-col justify-between gap-3 relative group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getTypeBadge(notif.type)}
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          To: <span className="text-slate-600 font-black">{getRecipientLabel(notif)}</span>
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm leading-snug pt-1">
                        {notif.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed pt-0.5">
                        {notif.message}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer focus:outline-none flex-shrink-0"
                      title="Remove notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100/50 pt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Admin Dispatched</span>
                    <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit' })}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-slate-400 font-semibold text-xs uppercase tracking-wider flex flex-col items-center gap-2">
                <Bell size={24} className="text-slate-200" />
                <span>No active dispatched notifications</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notifications;
