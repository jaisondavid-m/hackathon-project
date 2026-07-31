import React, { useState, useEffect } from 'react';
import { Layers, Search, Plus, Trash2, AlertCircle, X, HelpCircle, Check, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { otpMappingService } from '../../api/otpMapping';
import { venueService } from '../../api/venue';
import { authService } from '../../api/auth';

function OtpMapping() {
  const [mappings, setMappings] = useState([]);
  const [venues, setVenues] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFacultyEmail, setSelectedFacultyEmail] = useState('');
  const [selectedStudentEmails, setSelectedStudentEmails] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('CS101');
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState({});

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

      // Filter only faculty roles
      const filteredFaculty = usersData.filter(u => u.role === 'faculty');
      setFaculties(filteredFaculty);

      if (venuesData.length > 0) {
        setSelectedVenueId(venuesData[0].id);
      }
      if (filteredFaculty.length > 0) {
        setSelectedFacultyEmail(filteredFaculty[0].emailid);
      }
      setSelectedStudentEmails([]);
      setStudentSearchTerm('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch mapping configurations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMapping = async (e) => {
    e.preventDefault();
    if (!selectedFacultyEmail) {
      setError('Please select a faculty member.');
      return;
    }
    if (selectedStudentEmails.length === 0) {
      setError('Please select at least one student.');
      return;
    }
    if (!selectedVenueId) {
      setError('Please select a venue.');
      return;
    }

    setSubmitLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      faculty_email: selectedFacultyEmail,
      class_id: selectedClassId,
      venue_id: parseInt(selectedVenueId),
      student_emails: selectedStudentEmails
    };

    try {
      await otpMappingService.createOtpMapping(payload);
      setSuccess('OTP mapping configured successfully.');
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to register mapping. Try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteMapping = async (id) => {
    if (!window.confirm('Are you sure you want to delete this OTP mapping config?')) return;
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

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleStudent = (emailid) => {
    setSelectedStudentEmails(prev =>
      prev.includes(emailid)
        ? prev.filter(e => e !== emailid)
        : [...prev, emailid]
    );
  };

  // Filter students in the modal multi-select list
  const filteredModalStudents = students.filter(s =>
    (s.name || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    (s.emailid || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  const handleSelectAllFilteredStudents = () => {
    const filteredEmails = filteredModalStudents.map(s => s.emailid);
    setSelectedStudentEmails(prev => {
      const union = new Set([...prev, ...filteredEmails]);
      return Array.from(union);
    });
  };

  const handleClearSelectedStudents = () => {
    setSelectedStudentEmails([]);
  };

  // Filter mappings in main list
  const filteredMappings = mappings.filter(m => {
    const query = searchTerm.toLowerCase();
    const matchesFaculty =
      (m.faculty_name || '').toLowerCase().includes(query) ||
      (m.faculty_email || '').toLowerCase().includes(query);
    const matchesClass =
      (m.class_id || '').toLowerCase().includes(query) ||
      (m.class_name || '').toLowerCase().includes(query);
    const matchesVenue =
      (m.venue_name || '').toLowerCase().includes(query);
    const matchesStudents =
      (m.students || []).some(s =>
        (s.student_name || '').toLowerCase().includes(query) ||
        (s.student_email || '').toLowerCase().includes(query)
      );
    return matchesFaculty || matchesClass || matchesVenue || matchesStudents;
  });

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">OTP Bounding Mapping</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Map faculty to multiple students, subjects, and venues to automate validation and secure OTP marking
          </p>
        </div>
        <button
          onClick={() => {
            // Re-initialize states when opening modal
            if (faculties.length > 0) setSelectedFacultyEmail(faculties[0].emailid);
            if (venues.length > 0) setSelectedVenueId(venues[0].id);
            setSelectedStudentEmails([]);
            setStudentSearchTerm('');
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7D53F6] hover:bg-[#683cdb] text-white text-xs font-bold rounded-2xl shadow-lg shadow-[#7D53F6]/15 transition-all duration-150 cursor-pointer animate-fade-in"
        >
          <Plus size={16} />
          <span>Add OTP Mapping</span>
        </button>
      </div>

      {/* Message Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2 animate-shake">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 bg-white p-3 border border-slate-100 rounded-3xl shadow-sm">
        <Search size={18} className="text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search mappings by faculty, class, venue, or student email/name..."
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
                <th className="p-4 pl-6 w-[35%]">Faculty Details</th>
                <th className="p-4 w-[25%]">Mapped Class (Subject)</th>
                <th className="p-4 w-[20%]">Mapped Venue</th>
                <th className="p-4 w-[12%] text-center">Students</th>
                <th className="p-4 pr-6 w-[8%] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredMappings.map((m) => {
                const isExpanded = !!expandedRows[m.id];
                const studentCount = m.students ? m.students.length : 0;
                return (
                  <React.Fragment key={m.id}>
                    <tr className="hover:bg-slate-50/20 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-slate-800">{m.faculty_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">{m.faculty_email}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#7D53F6]/5 text-[#7D53F6] text-[10px] font-extrabold uppercase rounded-lg border border-[#7D53F6]/10 leading-none">
                          {m.class_id}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-2 font-bold">{m.class_name}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-600">{m.venue_name}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleRow(m.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-[#7D53F6]/10 text-slate-600 hover:text-[#7D53F6] rounded-xl transition-all cursor-pointer text-[11px] font-bold"
                        >
                          <span>{studentCount} {studentCount === 1 ? 'Student' : 'Students'}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
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
                    
                    {/* Expandable row showing mapped students */}
                    {isExpanded && (
                      <tr className="bg-slate-50/40">
                        <td colSpan={5} className="p-4 pl-6 pr-6 border-t border-slate-100/50">
                          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Users size={14} className="text-[#7D53F6]" />
                                Mapped Student Roster ({studentCount})
                              </span>
                            </div>
                            
                            {studentCount > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {m.students.map((s) => (
                                  <div key={s.id} className="p-2 bg-slate-50 border border-slate-100/80 rounded-xl flex flex-col hover:border-[#7D53F6]/20 transition-all">
                                    <span className="font-bold text-slate-700 text-xs">{s.student_name}</span>
                                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">{s.student_email}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-slate-400 text-[11px] font-bold italic py-2">
                                No students currently registered in this mapping configuration.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-20 text-center text-slate-400 font-semibold text-sm">
            No mapping configurations found.
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
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 animate-zoomIn flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="h-16 px-6 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <Layers size={18} className="text-[#7D53F6]" />
                Map Faculty & Student Attendance
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateMapping} className="p-6 space-y-4 overflow-y-auto flex-grow">
              
              {/* Select Faculty */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Select Faculty Member
                </label>
                <select
                  value={selectedFacultyEmail}
                  onChange={(e) => setSelectedFacultyEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 text-slate-800 font-semibold text-sm rounded-xl focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all cursor-pointer"
                >
                  {faculties.length > 0 ? (
                    faculties.map(f => (
                      <option key={f.id} value={f.emailid}>
                        {f.name} ({f.emailid})
                      </option>
                    ))
                  ) : (
                    <option value="">No Faculty Members Registered</option>
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

              {/* Select Students (Multi-Select Interface) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Select Students ({selectedStudentEmails.length} Selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFilteredStudents}
                      className="text-[10px] font-bold text-[#7D53F6] hover:underline focus:outline-none cursor-pointer"
                    >
                      Select All Matching
                    </button>
                    <span className="text-[10px] text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearSelectedStudents}
                      className="text-[10px] font-bold text-slate-400 hover:underline focus:outline-none cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Search box inside the students list */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mb-2">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search students to select..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-0 text-slate-700 font-medium placeholder-slate-400 text-xs focus:outline-none focus:ring-0 p-0"
                  />
                </div>

                {/* Students list container */}
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50">
                  {filteredModalStudents.length > 0 ? (
                    filteredModalStudents.map(s => {
                      const isChecked = selectedStudentEmails.includes(s.emailid);
                      return (
                        <label
                          key={s.id}
                          className="flex items-center gap-3 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl cursor-pointer select-none transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleStudent(s.emailid)}
                            className="rounded text-[#7D53F6] focus:ring-[#7D53F6] border-slate-300 cursor-pointer h-4 w-4"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-700 truncate">{s.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 truncate">{s.emailid}</span>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="text-center text-slate-400 text-xs py-6 font-semibold italic">
                      No students found matching your search
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-600 font-bold rounded-2xl text-xs transition-all duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || faculties.length === 0 || selectedStudentEmails.length === 0 || venues.length === 0}
                  className="w-1/2 py-2.5 bg-[#7D53F6] hover:bg-[#683cdb] text-white font-bold rounded-2xl text-xs shadow-lg shadow-[#7D53F6]/15 transition-all duration-150 cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
