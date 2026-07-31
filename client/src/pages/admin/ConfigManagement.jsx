import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, AlertCircle, CheckCircle, Save, Layers, ChevronLeft, ChevronRight, Calendar, Info 
} from 'lucide-react';
import { configService } from '../../api/config';
import { venueService } from '../../api/venue';
import InputField from '../../components/InputField';

function ConfigManagement() {
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

  // Load Configurations on Mount
  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setHoursLoading(true);
      const [hoursData, holidaysData, venuesData] = await Promise.all([
        configService.getHourConfigs(),
        configService.getHolidays().catch(err => { console.error('Failed to load holidays:', err); return []; }),
        venueService.getVenues().catch(err => { console.error('Failed to load venues:', err); return []; })
      ]);
      setHours(hoursData);
      setHolidays(holidaysData);
      setVenues(venuesData);
    } catch (err) {
      setHoursError('Failed to load configurations.');
    } finally {
      setHoursLoading(false);
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

  // Render Calendar Month Grid (memoized)
  const daysInMonth = useMemo(() => getDaysInMonth(currentMonthDate), [currentMonthDate]);
  const firstDayIndex = useMemo(() => new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1).getDay(), [currentMonthDate]);
  const emptyDaysBefore = useMemo(() => Array.from({ length: firstDayIndex }), [firstDayIndex]);
  const monthName = useMemo(() => currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' }), [currentMonthDate]);

  return (
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

            {/* Coordinates Input Grid */}
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
  );
}

export default ConfigManagement;
