import React, { useState, useEffect } from 'react';
import { Layers, Search, Plus, Trash2, AlertCircle, X, HelpCircle, Check } from 'lucide-react';
import { otpMappingService } from '../../api/otpMapping';
import { venueService } from '../../api/venue';
import { authService } from '../../api/auth';

function OtpMapping() {
  const [mappings, setMappings] = useState([]);
  const [venues, setVenues] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentEmail, setSelectedStudentEmail] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('CS101');
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const classes = [
    { id: 'CS101', name: 'Computer Science (CS-A)' },
    { id: 'CS202', name: 'Data Structures (CS-B)' },
    { id: 'CS305', name: 'Web Engineering' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [mapsData, venuesData, usersData] = await Promise.all([
        otpMappingService.getOtpMappings(),
        venueService.getVenues(),
        authService.getUsers()
      ]);
      setMappings(mapsData);
      setVenues(venuesData);
      // Filter only student roles
      const filteredStudents = usersData.filter(u => u.role === 'student');
      setStudents(filteredStudents);

      if (venuesData.length > 0) {
        setSelectedVenueId(venuesData[0].id);
      }
      if (filteredStudents.length > 0) {
        setSelectedStudentEmail(filteredStudents[0].email);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch mapping configurations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMapping = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccess('');

    const targetClass = classes.find(c => c.id === selectedClassId);

    const payload = {
      student_email: selectedStudentEmail,
      class_id: selectedClassId,
      class_name: targetClass ? targetClass.name : selectedClassId,
      venue_id: parseInt(selectedVenueId)
    };

    try {
      await otpMappingService.createOtpMapping(payload);
      setSuccess('Student OTP mapping added successfully.');
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to register student mapping. Try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteMapping = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student mapping?')) return;
    setError('');
    setSuccess('');
    try {
      await otpMappingService.deleteOtpMapping(id);
      setSuccess('Mapping removed successfully.');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to remove mapping.');
    }
  };

  // Filter mappings
  const filteredMappings = mappings.filter(m => 
    m.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.class_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.venue_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">OTP Bounding Mapping</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Map students to specific subjects and venues to automate validation and secure OTP marking
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7D53F6] hover:bg-[#683cdb] text-white text-xs font-bold rounded-2xl shadow-lg shadow-[#7D53F6]/15 transition-all duration-150 cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Student Mapping</span>
        </button>
      </div>

      {/* Message Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 bg-white p-3 border border-slate-100 rounded-3xl shadow-sm">
        <Search size={18} className="text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search mappings by email, name, class or venue..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-0 text-slate-700 font-semibold placeholder-slate-400 text-xs focus:outline-none focus:ring-0"
        />
      </div>

      {/* Table container */}
      <div className="overflow-x-auto border border-slate-100 rounded-3xl bg-white shadow-sm">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-[#7D53F6]/20 border-t-[#7D53F6] rounded-full animate-spin" />
          </div>
        ) : filteredMappings.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
                <th className="p-4 pl-6">Student Name</th>
                <th className="p-4">Email ID</th>
                <th className="p-4">Mapped Class (Subject)</th>
                <th className="p-4">Mapped Venue</th>
                <th className="p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredMappings.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/20 transition-colors">
                  <td className="p-4 pl-6 font-bold text-slate-800">{m.student_name}</td>
                  <td className="p-4 text-slate-500 font-mono text-[11px]">{m.student_email}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#7D53F6]/5 text-[#7D53F6] text-[10px] font-extrabold uppercase rounded-lg border border-[#7D53F6]/10 leading-none">
                      {m.class_id}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-2 font-bold">{m.class_name}</span>
                  </td>
                  <td className="p-4 font-bold text-slate-600">{m.venue_name}</td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => handleDeleteMapping(m.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete mapping"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-20 text-center text-slate-400 font-semibold text-sm">
            No mappings matching search parameters found.
          </div>
        )}
      </div>

      {/* Info Tip */}
      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex items-start gap-3 text-slate-500 text-xs leading-relaxed">
        <HelpCircle size={18} className="text-[#7D53F6] flex-shrink-0 mt-0.5" />
        <div>
          <strong>System Architecture Rule:</strong> When faculty start a session, they only pick the hour. Students mark attendance by entering OTP. The system queries this table to verify what subject the student belongs to and what venue geofence limits to verify them against.
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-zoomIn flex flex-col">
            
            {/* Modal Header */}
            <div className="h-16 px-6 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <Layers size={18} className="text-[#7D53F6]" />
                Map Student Attendance
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateMapping} className="p-6 space-y-4">
              
              {/* Select Student */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Select Student
                </label>
                <select
                  value={selectedStudentEmail}
                  onChange={(e) => setSelectedStudentEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 text-slate-800 font-semibold text-sm rounded-xl focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all cursor-pointer"
                >
                  {students.length > 0 ? (
                    students.map(s => (
                      <option key={s.id} value={s.email}>
                        {s.name} ({s.email})
                      </option>
                    ))
                  ) : (
                    <option value="">No Students Registered</option>
                  )}
                </select>
              </div>

              {/* Select Class */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Select Class / Subject
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 text-slate-800 font-semibold text-sm rounded-xl focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all cursor-pointer"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Venue */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Select Bounding Venue
                </label>
                <select
                  value={selectedVenueId}
                  onChange={(e) => setSelectedVenueId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 text-slate-800 font-semibold text-sm rounded-xl focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all cursor-pointer"
                >
                  {venues.length > 0 ? (
                    venues.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))
                  ) : (
                    <option value="">No Venues Created</option>
                  )}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-50 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-600 font-bold rounded-2xl text-xs transition-all duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || students.length === 0 || venues.length === 0}
                  className="w-1/2 py-2.5 bg-[#7D53F6] hover:bg-[#683cdb] text-white font-bold rounded-2xl text-xs shadow-lg shadow-[#7D53F6]/15 transition-all duration-150 cursor-pointer flex justify-center items-center gap-2"
                >
                  {submitLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Register Mapping</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OtpMapping;
