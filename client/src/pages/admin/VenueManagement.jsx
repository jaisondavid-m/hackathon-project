import React, { useState, useEffect } from 'react';
import { Layers, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { venueService } from '../../api/venue';
import InputField from '../../components/InputField';

function VenueManagement() {
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

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setVenueLoading(true);
      const venuesData = await venueService.getVenues();
      setVenues(venuesData);
    } catch (err) {
      console.error('Failed to load venues:', err);
      setVenueError('Failed to load registered venues.');
    } finally {
      setVenueLoading(false);
    }
  };

  const handleVenueChange = (e) => {
    const { name, value } = e.target;
    setVenueFormData((prev) => ({ ...prev, [name]: value }));
    if (venueError) setVenueError('');
    if (venueSuccess) setVenueSuccess('');
  };

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100/80 p-6">
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

        <form onSubmit={handleVenueSubmit} className="space-y-6">
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

          {/* Coordinates Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {[1, 2, 3, 4].map((cornerNum) => (
              <div key={cornerNum} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">
                    Corner {cornerNum}
                  </label>
                  <button
                    type="button"
                    onClick={() => pinCorner(cornerNum)}
                    disabled={venueLoading}
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
                      placeholder="Lat"
                      required
                      disabled={venueLoading}
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
                      placeholder="Lon"
                      required
                      disabled={venueLoading}
                      className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 font-semibold rounded-xl text-xs focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all duration-150"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={venueLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#7D53F6] hover:bg-[#683cdb] text-white text-xs font-extrabold tracking-widest uppercase rounded-2xl shadow-md shadow-[#7D53F6]/15 hover:shadow-[#7D53F6]/25 transition-all duration-200 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {venueLoading ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : (
              <>
                <Save size={16} />
                <span>Create Venue Geofence</span>
              </>
            )}
          </button>
        </form>

        {/* Venues list registry */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">
            Registered Bounding Venues
          </h3>
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {venues.length > 0 ? (
              venues.map((v) => (
                <div key={v.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <span className="font-bold text-xs text-slate-700 block leading-none">{v.name}</span>
                  <div className="grid grid-cols-2 gap-2 text-[8px] text-slate-400 font-mono mt-3 leading-none">
                    <span>C1: {v.lat1.toFixed(5)}, {v.lon1.toFixed(5)}</span>
                    <span>C2: {v.lat2.toFixed(5)}, {v.lon2.toFixed(5)}</span>
                    <span>C3: {v.lat3.toFixed(5)}, {v.lon3.toFixed(5)}</span>
                    <span>C4: {v.lat4.toFixed(5)}, {v.lon4.toFixed(5)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold uppercase">
                No venues added yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VenueManagement;
