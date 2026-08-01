import React, { useState, useEffect } from 'react';
import { Layers, AlertCircle, CheckCircle, Save, X, MapPin, Edit3, Wifi, Eye } from 'lucide-react';
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
    lat4: '', lon4: '',
    router_count: 0,
    router_ips: []
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [coordsDetailVenue, setCoordsDetailVenue] = useState(null);
  const [routerDetailVenue, setRouterDetailVenue] = useState(null);
  const [modalTab, setModalTab] = useState('gps');

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
      lat4: '', lon4: '',
      router_count: 0,
      router_ips: []
    });
    setFormError('');
    setFormSuccess('');
    setModalTab('gps');
    setIsModalOpen(true);
  };

  const handleEditClick = (venue) => {
    setEditingVenue(venue);
    const existingIPs = (venue.routers || []).map(r => r.ip_address);
    const count = venue.router_count || existingIPs.length;
    setVenueFormData({
      name: venue.name,
      lat1: String(venue.lat1), lon1: String(venue.lon1),
      lat2: String(venue.lat2), lon2: String(venue.lon2),
      lat3: String(venue.lat3), lon3: String(venue.lon3),
      lat4: String(venue.lat4), lon4: String(venue.lon4),
      router_count: count,
      router_ips: [...existingIPs, ...Array(Math.max(0, count - existingIPs.length)).fill('')]
    });
    setFormError('');
    setFormSuccess('');
    setModalTab('gps');
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
      router_count: venueFormData.router_count,
      router_ips: venueFormData.router_ips.filter(ip => ip.trim() !== ''),
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
        lat4: '', lon4: '',
        router_count: 0,
        router_ips: []
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
                <th className="p-4">Latitude, Longitude</th>
                <th className="p-4">Router IPs</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {venues.length > 0 ? (
                venues.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/30 text-xs font-semibold text-slate-700 transition-colors">
                    {/* Venue Name */}
                    <td className="p-4 pl-6 font-bold text-slate-800 text-sm">{v.name}</td>

                    {/* Coordinates - View Button */}
                    <td className="p-4">
                      <button
                        onClick={() => setCoordsDetailVenue(v)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 cursor-pointer transition-colors focus:outline-none"
                      >
                        <Eye size={11} />
                        <span>View Corners</span>
                      </button>
                    </td>

                    {/* Router IPs - View Button */}
                    <td className="p-4">
                      {v.router_count > 0 ? (
                        <button
                          onClick={() => setRouterDetailVenue(v)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase bg-[#7D53F6]/5 hover:bg-[#7D53F6]/10 text-[#7D53F6] border border-[#7D53F6]/10 cursor-pointer transition-colors focus:outline-none"
                        >
                          <Wifi size={11} />
                          <span>{v.router_count} Router{v.router_count > 1 ? 's' : ''} — View</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-semibold">No routers</span>
                      )}
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
                  <td colSpan={4} className="text-center py-12 text-slate-400 font-semibold uppercase">
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
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-[580px] overflow-hidden animate-zoomIn flex flex-col max-h-[90vh]">
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

            <form onSubmit={handleVenueSubmit} className="flex flex-col overflow-y-auto flex-grow">
              <div className="p-6 pb-0 space-y-4">
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

                {/* Tab Switcher */}
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setModalTab('gps')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer focus:outline-none ${
                      modalTab === 'gps'
                        ? 'bg-white text-[#7D53F6] shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <MapPin size={12} />
                    GPS Coordinates
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('wifi')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer focus:outline-none ${
                      modalTab === 'wifi'
                        ? 'bg-white text-[#7D53F6] shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Wifi size={12} />
                    WiFi Routers
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 space-y-4">
                {modalTab === 'gps' && (
                  <>
                    <div className="bg-[#EEF1F9]/50 border border-slate-100 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-wide block mb-1 leading-none">
                        📍 GPS Mapping Instructions
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold leading-snug block mt-0.5">
                        Input coordinates manually or walk to each physical corner and click the "Pin GPS" button to fetch them.
                      </span>
                    </div>

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
                  </>
                )}

                {modalTab === 'wifi' && (
                  <>
                    <div className="bg-[#EEF1F9]/50 border border-slate-100 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-wide block mb-1 leading-none">
                        📡 WiFi Router Configuration
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold leading-snug block mt-0.5">
                        Enter the number of WiFi routers in this venue, then provide each router's static IP address.
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">
                        Number of Routers
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={venueFormData.router_count}
                        onChange={(e) => {
                          const count = Math.max(0, Math.min(20, parseInt(e.target.value) || 0));
                          setVenueFormData((prev) => {
                            const existing = prev.router_ips;
                            const newIPs = Array.from({ length: count }, (_, i) => existing[i] || '');
                            return { ...prev, router_count: count, router_ips: newIPs };
                          });
                        }}
                        disabled={formLoading}
                        className="w-28 px-3 py-2 bg-white border border-slate-200 text-slate-800 font-bold rounded-xl text-xs focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all duration-150"
                      />
                    </div>

                    {venueFormData.router_count > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Router Static IPs</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {venueFormData.router_ips.map((ip, index) => (
                            <div key={index} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                              <span className="text-[9px] font-extrabold text-[#7D53F6] bg-[#7D53F6]/10 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0">#{index + 1}</span>
                              <input
                                type="text"
                                value={ip}
                                onChange={(e) => {
                                  const updated = [...venueFormData.router_ips];
                                  updated[index] = e.target.value;
                                  setVenueFormData((prev) => ({ ...prev, router_ips: updated }));
                                }}
                                placeholder="e.g. 192.168.1.1"
                                disabled={formLoading}
                                className="flex-grow px-3 py-1.5 bg-white border border-slate-200 text-slate-800 font-mono font-semibold rounded-lg text-xs focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all duration-150"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {venueFormData.router_count === 0 && (
                      <div className="text-center py-8 text-slate-300">
                        <Wifi size={28} className="mx-auto mb-2" />
                        <span className="text-xs font-semibold block">No routers configured</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Set the router count above to add IP addresses</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex gap-3">
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
      {/* Coordinates Detail Modal */}
      {coordsDetailVenue && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-[420px] overflow-hidden animate-zoomIn flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <MapPin size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">{coordsDetailVenue.name}</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Geofence Corner Coordinates</p>
                </div>
              </div>
              <button
                onClick={() => setCoordsDetailVenue(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto flex-grow">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Corner {n}</span>
                  <div className="text-right">
                    <span className="block font-mono text-xs font-semibold text-slate-700">
                      {coordsDetailVenue[`lat${n}`].toFixed(6)}
                    </span>
                    <span className="block font-mono text-xs font-semibold text-slate-500">
                      {coordsDetailVenue[`lon${n}`].toFixed(6)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setCoordsDetailVenue(null)}
                className="w-full py-2.5 border border-slate-200 text-slate-500 font-extrabold text-xs tracking-wider uppercase rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Router IPs Detail Modal */}
      {routerDetailVenue && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-[420px] overflow-hidden animate-zoomIn flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-[#7D53F6]/10 text-[#7D53F6] rounded-lg">
                  <Wifi size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">{routerDetailVenue.name}</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {routerDetailVenue.router_count} WiFi Router{routerDetailVenue.router_count > 1 ? 's' : ''} Configured
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRouterDetailVenue(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-2 overflow-y-auto flex-grow">
              {(routerDetailVenue.routers || []).length > 0 ? (
                (routerDetailVenue.routers || []).map((r, i) => (
                  <div key={r.id || i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Router #{i + 1}</span>
                    <span className="font-mono text-xs font-bold text-slate-700">{r.ip_address}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold uppercase">
                  No router IPs recorded
                </div>
              )}
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setRouterDetailVenue(null)}
                className="w-full py-2.5 border border-slate-200 text-slate-500 font-extrabold text-xs tracking-wider uppercase rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors focus:outline-none"
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

export default VenueManagement;
