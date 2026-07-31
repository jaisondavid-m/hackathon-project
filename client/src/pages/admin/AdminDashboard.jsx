import React, { useState } from 'react';
import { Users, Settings, Layers } from 'lucide-react';
import UserManagement from './UserManagement';
import ConfigManagement from './ConfigManagement';
import AuditLogs from './AuditLogs';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'config', or 'audit'

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

      {/* Conditionally render the active console view */}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'config' && <ConfigManagement />}
      {activeTab === 'audit' && <AuditLogs />}
    </div>
  );
}

export default AdminDashboard;
