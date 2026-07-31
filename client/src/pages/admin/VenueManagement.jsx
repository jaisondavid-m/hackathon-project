import React, { useState, useEffect } from 'react';
import { Layers, AlertCircle, CheckCircle, Save, X, MapPin, Edit3 } from 'lucide-react';
import { venueService } from '../../api/venue';
import InputField from '../../components/InputField';

function VenueManagement() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [venueFormData, setVenueFormData] = useState({
    name: '',
    lat1: '', lon1: '',
    lat2: '', lon2: '',
    lat3: '', lon3: '',
    lat4: '', lon4: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      setError('');
      const venuesData = await venueService.getVenues();
      setVenues(venuesData);
    } catch (err) {
      console.error('Failed to load venues:', err);
      setError('Failed to retrieve registered geofence venues.');
    } finally {
      setLoading(false);
    }
  };

  const handleVenueChange = (e) => {
    const { name, value } = e.target;
    setVenueFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
    if (formSuccess) setFormSuccess('');
  };

  const handleAddNewClick = () => {
    setEditingVenue(null);
    setVenueFormData({
      name: '',
      lat1: '', lon1: '',
      lat2: '', lon2: '',
      lat3: '', lon3: '',
      lat4: '', lon4: ''
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleEditClick = (venue) => {
    setEditingVenue(venue);
    setVenueFormData({
      name: venue.name,
      lat1: String(venue.lat1), lon1: String(venue.lon1),
      lat2: String(venue.lat2), lon2: String(venue.lon2),
      lat3: String(venue.lat3), lon3: String(venue.lon3),
      lat4: String(venue.lat4), lon4: String(venue.lon4)
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const pinCorner = (cornerNum) => {
    setFormError('');
    setFormSuccess('');
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
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

        setFormSuccess(`Successfully pinned coordinates for Corner ${cornerNum}!`);
      },
      (error) => {
        console.error(error);
        setFormError(`Failed to fetch current GPS coordinates: ${error.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const handleVenueSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

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
      if (editingVenue) {
        const updated = await venueService.updateVenue(editingVenue.id, payload);
        setFormSuccess(`Venue "${updated.name}" successfully updated!`);
        setVenues((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      } else {
        const newVenue = await venueService.createVenue(payload);
        setFormSuccess(`Venue "${newVenue.name}" successfully created!`);
        setVenues((prev) => [...prev, newVenue]);
      }

      // Reset form and close modal
      setVenueFormData({
        name: '',
        lat1: '', lon1: '',
        lat2: '', lon2: '',
        lat3: '', lon3: '',
        lat4: '', lon4: ''
      });
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess('');
        setEditingVenue(null);
      }, 1000);
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.error || 'Failed to save geofence venue coordinates.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#7D53F6]/10 text-[#7D53F6] rounded-xl">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Venue Management</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Review bounding lecture halls or register new geofenced classrooms
            </p>
          </div>
        </div>

        <button
          onClick={handleAddNewClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7D53F6] hover:bg-[#683cdb] text-white text-xs font-extrabold tracking-wider uppercase rounded-2xl cursor-pointer shadow-md shadow-[#7D53F6]/15 hover:shadow-[#7D53F6]/25 transition-all duration-200 focus:outline-none"
        >
          <MapPin size={16} />
          <span>Add Venue</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 text-sm">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Venues table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-[#7D53F6]/25 border-t-[#7D53F6] rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Retrieving bounding venues...</span>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 rounded-3xl bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <th className="p-4 pl-6">Venue Name</th>
                <th className="p-4">Corner 1 (Lat, Lon)</th>
                <th className="p-4">Corner 2 (Lat, Lon)</th>
                <th className="p-4">Corner 3 (Lat, Lon)</th>
                <th className="p-4">Corner 4 (Lat, Lon)</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {venues.length > 0 ? (
                venues.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/30 text-xs font-semibold text-slate-700 transition-colors">
                    {/* Venue Name */}
                    <td className="p-4 pl-6 font-bold text-slate-800 text-sm">{v.name}</td>

                    {/* Corner 1 */}
                    <td className="p-4 font-mono text-[10px] text-slate-500">
                      {v.lat1.toFixed(6)}, {v.lon1.toFixed(6)}
                    </td>

                    {/* Corner 2 */}
                    <td className="p-4 font-mono text-[10px] text-slate-500">
                      {v.lat2.toFixed(6)}, {v.lon2.toFixed(6)}
                    </td>

                    {/* Corner 3 */}
                    <td className="p-4 font-mono text-[10px] text-slate-500">
                      {v.lat3.toFixed(6)}, {v.lon3.toFixed(6)}
                    </td>

                    {/* Corner 4 */}
                    <td className="p-4 font-mono text-[10px] text-slate-500">
                      {v.lat4.toFixed(6)}, {v.lon4.toFixed(6)}
                    </td>

                    {/* Actions column */}
                    <td className="p-4 pr-6 text-center">
                      <button
                        onClick={() => handleEditClick(v)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase bg-[#7D53F6]/5 hover:bg-[#7D53F6]/10 text-[#7D53F6] border border-[#7D53F6]/10 cursor-pointer focus:outline-none"
                      >
                        <Edit3 size={11} />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-semibold uppercase">
                    No registered boundary venues found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* boundary creation/edit modal popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-[580px] overflow-hidden animate-zoomIn">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-[#7D53F6]/10 text-[#7D53F6] rounded-lg">
                  <MapPin size={16} />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">
                  {editingVenue ? 'Edit Geofence Boundary' : 'Add Geofence Boundary'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setFormError('');
                  setFormSuccess('');
                  setEditingVenue(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleVenueSubmit} className="p-6 space-y-5">
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
                label="Venue Name"
                name="name"
                value={venueFormData.name}
                onChange={handleVenueChange}
                placeholder="e.g. CS Lecture Hall 101"
                required
                disabled={formLoading}
              />

              <div className="bg-[#EEF1F9]/50 border border-slate-100 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wide block mb-1 leading-none">
                  📍 GPS Mapping Instructions
                </span>
                <span className="text-[9px] text-slate-400 font-semibold leading-snug block mt-0.5">
                  Input coordinates manually or walk to each physical corner and click the "Pin GPS" button to fetch them.
                </span>
              </div>

              {/* Coordinates Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[1, 2, 3, 4].map((cornerNum) => (
                  <div key={cornerNum} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">
                        Corner {cornerNum}
                      </label>
                      <button
                        type="button"
                        onClick={() => pinCorner(cornerNum)}
                        disabled={formLoading}
                        className="text-[9px] font-extrabold text-[#7D53F6] hover:underline flex items-center gap-0.5 cursor-pointer focus:outline-none"
                      >
                        <span>📍 Pin GPS</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="number"
                          step="any"
                          name={`lat${cornerNum}`}
                          value={venueFormData[`lat${cornerNum}`]}
                          onChange={handleVenueChange}
                          placeholder="Latitude"
                          required
                          disabled={formLoading}
                          className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 font-semibold rounded-xl text-xs focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all duration-150"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="any"
                          name={`lon${cornerNum}`}
                          value={venueFormData[`lon${cornerNum}`]}
                          onChange={handleVenueChange}
                          placeholder="Longitude"
                          required
                          disabled={formLoading}
                          className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 font-semibold rounded-xl text-xs focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all duration-150"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormError('');
                    setFormSuccess('');
                    setEditingVenue(null);
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
                    <span>{editingVenue ? 'Update Venue' : 'Add Venue'}</span>
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

export default VenueManagement;
