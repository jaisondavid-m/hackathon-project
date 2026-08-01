import React from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  User, Mail, Shield, BookOpen, Key, Info, Edit3, Check
} from 'lucide-react';

function Profile() {
  const context = useOutletContext() || {};
  let user = context.user;

  // Fallback to localStorage if context user is not present
  if (!user) {
    try {
      user = JSON.parse(localStorage.getItem('pcdp_user') || '{}');
    } catch (e) {
      user = {};
    }
  }

  const role = user?.role || 'student';

  const getProfileData = () => {
    switch (role) {
      case 'admin':
        return {
          personal: {
            title: 'Personal Information',
            fields: [
              { label: 'Full Name', value: user?.name || 'Administrator' },
              { label: 'Mobile Number', value: '+91 99999 88888' },
              { label: 'Admin ID', value: `ADM-2024-00${user?.id || '1'}` },
              { label: 'Date of Birth', value: '10 October 1980' },
              { label: 'Email Address', value: user?.emailid || 'admin@bitsathy.ac.in' },
              { label: 'Address', value: 'Admin Block, BITS Campus, Erode, India' }
            ]
          },
          academic: {
            title: 'System Access Overview',
            fields: [
              { label: 'Security Role', value: 'Root Administrator' },
              { label: 'Clearance', value: 'Level 5' },
              { label: 'Managed Nodes', value: 'All Block Networks' },
              { label: 'Office Room', value: 'Server Room 01' },
              { label: 'Year Mapped', value: '2026' }
            ]
          },
          other: {
            title: 'Other Information',
            fields: [
              { label: 'Lead Security Auditor', value: 'Dr. Anand Kumar' },
              { label: 'Email Institution', value: user?.emailid || 'admin@bitsathy.ac.in' }
            ]
          }
        };

      case 'faculty':
        return {
          personal: {
            title: 'Personal Information',
            fields: [
              { label: 'Full Name', value: user?.name || 'Faculty Staff' },
              { label: 'Mobile Number', value: '+91 98765 43210' },
              { label: 'Employee ID', value: `FAC-2024-00${user?.id || '1'}` },
              { label: 'Date of Birth', value: '22 August 1985' },
              { label: 'Email Address', value: user?.emailid || 'faculty@bitsathy.ac.in' },
              { label: 'Address', value: 'Faculty Quarters, BITS Campus, Erode, India' }
            ]
          },
          academic: {
            title: 'Academic Information',
            fields: [
              { label: 'Department', value: 'Computer Science & Engineering' },
              { label: 'Designation', value: 'Associate Professor' },
              { label: 'Qualification', value: 'Ph.D. in CSE' },
              { label: 'Office Room', value: 'CSE Block Room 304' },
              { label: 'Joining Year', value: '2018' }
            ]
          },
          other: {
            title: 'Other Information',
            fields: [
              { label: 'Assigned Mentoring', value: 'Batch 2023-2027 Sec A' },
              { label: 'Email Institution', value: user?.emailid || 'faculty@bitsathy.ac.in' }
            ]
          }
        };

      case 'student':
      default:
        // Use student mapping details from user email or default Jaison David values
        const registerNumber = `2023CSE0${user?.id || '2'}`;
        return {
          personal: {
            title: 'Personal Information',
            fields: [
              { label: 'Full Name', value: user?.name || 'Jaison David' },
              { label: 'Mobile Number', value: '+91 93456 78901' },
              { label: 'Register Number', value: registerNumber },
              { label: 'Date of Birth', value: '14 May 2004' },
              { label: 'Email Address', value: user?.emailid || 'jaisondavidm.cs25@bitsathy.ac.in' },
              { label: 'Address', value: 'Coimbatore, Tamil Nadu, India' }
            ]
          },
          academic: {
            title: 'Academic Information',
            fields: [
              { label: 'Department', value: 'Computer Science & Engineering' },
              { label: 'Year', value: 'III Year' },
              { label: 'Semester', value: '6th Semester' },
              { label: 'Section', value: 'A' },
              { label: 'Batch', value: '2023 - 2027' }
            ]
          },
          other: {
            title: 'Other Information',
            fields: [
              { label: 'Faculty Advisor', value: 'Dr. Anand Kumar' },
              { label: 'Email Institution', value: user?.emailid || 'jaisondavidm.cs25@bitsathy.ac.in' }
            ]
          }
        };
    }
  };

  const profileData = getProfileData();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Title & Subtitle */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Profile</h2>
        <p className="text-slate-400 font-semibold text-xs leading-none">
          View and manage your personal and academic information.
        </p>
      </div>

      {/* 1. Personal Information Card */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-5 sm:p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl">
              <User size={18} />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm tracking-wide">
              {profileData.personal.title}
            </h3>
          </div>
          
          <button
            onClick={() => alert("Profile editing is currently managed by the academic administration office.")}
            className="flex items-center gap-1.5 border border-[#7D53F6]/20 bg-[#7D53F6]/5 hover:bg-[#7D53F6]/10 text-[#7D53F6] px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer focus:outline-none"
          >
            <Edit3 size={13} />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {profileData.personal.fields.map((field, idx) => (
            <div key={idx} className="space-y-1 truncate">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {field.label}
              </span>
              <span className="font-extrabold text-slate-700 text-sm truncate block">
                {field.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Academic Information Card */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-5 sm:p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="p-2 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl">
            <BookOpen size={18} />
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm tracking-wide">
            {profileData.academic.title}
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
          {profileData.academic.fields.map((field, idx) => (
            <div key={idx} className="space-y-1 truncate">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {field.label}
              </span>
              <span className="font-extrabold text-slate-700 text-sm truncate block">
                {field.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Other Information Card */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-5 sm:p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="p-2 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl">
            <Info size={18} />
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm tracking-wide">
            {profileData.other.title}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {profileData.other.fields.map((field, idx) => (
            <div key={idx} className="space-y-1 truncate">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {field.label}
              </span>
              <span className="font-extrabold text-slate-700 text-sm truncate block">
                {field.value}
              </span>
            </div>
          ))}
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Account Status
            </span>
            <div className="flex items-center">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span>Active</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
