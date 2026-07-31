import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { configService } from '../../api/config';

function SessionDetails() {
  const [hours, setHours] = useState([]);
  const [hoursLoading, setHoursLoading] = useState(false);
  const [hoursSuccess, setHoursSuccess] = useState('');
  const [hoursError, setHoursError] = useState('');

  useEffect(() => {
    fetchHours();
  }, []);

  const fetchHours = async () => {
    try {
      setHoursLoading(true);
      const hoursData = await configService.getHourConfigs();
      setHours(hoursData);
    } catch (err) {
      setHoursError('Failed to load hour configurations.');
    } finally {
      setHoursLoading(false);
    }
  };

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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Daily Hours Config card */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-6">
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

        {hoursLoading && hours.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-[#7D53F6]/25 border-t-[#7D53F6] rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading timeslots...</span>
          </div>
        ) : (
          <form onSubmit={handleHoursSubmit} className="space-y-6">
            <div className="space-y-3">
              {hours.map((h, i) => (
                <div
                  key={h.id || h.hour_number}
                  className="flex items-center gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-2xl"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#7D53F6]/10 text-[#7D53F6] font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                    H{h.hour_number}
                  </div>

                  <div className="grid grid-cols-2 gap-4 flex-grow">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                        Start Time
                      </label>
                      <input
                        type="text"
                        value={h.start_time}
                        onChange={(e) => handleHourTimeChange(i, 'start_time', e.target.value)}
                        placeholder="e.g. 09:00 AM"
                        required
                        disabled={hoursLoading}
                        className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all duration-150"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                        End Time
                      </label>
                      <input
                        type="text"
                        value={h.end_time}
                        onChange={(e) => handleHourTimeChange(i, 'end_time', e.target.value)}
                        placeholder="e.g. 10:00 AM"
                        required
                        disabled={hoursLoading}
                        className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all duration-150"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={hoursLoading}
              className="w-full bg-[#7D53F6] hover:bg-[#683cdb] text-white py-3 rounded-2xl font-extrabold text-xs tracking-widest uppercase cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-[#7D53F6]/15 hover:shadow-[#7D53F6]/25 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {hoursLoading ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Timeslots Config</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default SessionDetails;
