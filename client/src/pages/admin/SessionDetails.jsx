import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, Save, Clock1, Clock2, Clock3, Clock4, Clock5, Clock6, Clock7, Timer } from 'lucide-react';
import { configService } from '../../api/config';

function SessionDetails() {
  const [hours, setHours] = useState([]);
  const [hoursLoading, setHoursLoading] = useState(false);
  const [hoursSuccess, setHoursSuccess] = useState('');
  const [hoursError, setHoursError] = useState('');

  const getHourIcon = (hourNum, className = "text-[#7D53F6]", size = 13) => {
    switch (hourNum) {
      case 1: return <Clock1 size={size} className={className} />;
      case 2: return <Clock2 size={size} className={className} />;
      case 3: return <Clock3 size={size} className={className} />;
      case 4: return <Clock4 size={size} className={className} />;
      case 5: return <Clock5 size={size} className={className} />;
      case 6: return <Clock6 size={size} className={className} />;
      case 7: return <Clock7 size={size} className={className} />;
      default: return <Clock size={size} className={className} />;
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    try {
      const parseTimeToMinutes = (timeStr) => {
        if (!timeStr) return null;
        let cleaned = timeStr.trim().toUpperCase();
        const match = cleaned.match(/^(\d{1,2})(?:[\s:\.]*(\d{1,2}))?(?:\s*(AM|PM))?$/);
        if (!match) return null;
        let hrs = parseInt(match[1], 10);
        let mins = match[2] ? parseInt(match[2], 10) : 0;
        const ampm = match[3];
        if (ampm) {
          if (ampm === 'PM' && hrs < 12) hrs += 12;
          if (ampm === 'AM' && hrs === 12) hrs = 0;
        }
        if (hrs < 0 || hrs > 23 || mins < 0 || mins > 59) return null;
        return hrs * 60 + mins;
      };
      const startMin = parseTimeToMinutes(start);
      const endMin = parseTimeToMinutes(end);
      if (startMin === null || endMin === null) return '';
      let diff = endMin - startMin;
      if (diff < 0) diff += 24 * 60;
      if (diff === 0) return '';
      const hoursPart = Math.floor(diff / 60);
      const minsPart = diff % 60;
      if (hoursPart > 0 && minsPart > 0) {
        return `${hoursPart}h ${minsPart}m`;
      } else if (hoursPart > 0) {
        return `${hoursPart}h`;
      } else {
        return `${minsPart}m`;
      }
    } catch (e) {
      return '';
    }
  };

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
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Daily Hours Config card */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-4">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
          <div className="p-1.5 bg-[#7D53F6]/10 text-[#7D53F6] rounded-lg">
            <Clock size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-none">Daily Hours Config</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 leading-none">
              Configure Start/End times for 7 slots
            </p>
          </div>
        </div>

        {hoursError && (
          <div className="mb-3.5 p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertCircle size={14} />
            <span>{hoursError}</span>
          </div>
        )}

        {hoursSuccess && (
          <div className="mb-3.5 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-semibold animate-pulse">
            <CheckCircle size={14} />
            <span>{hoursSuccess}</span>
          </div>
        )}

        {hoursLoading && hours.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-3 border-[#7D53F6]/25 border-t-[#7D53F6] rounded-full animate-spin" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loading timeslots...</span>
          </div>
        ) : (
          <form onSubmit={handleHoursSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {hours.map((h, i) => (
                <div
                  key={h.id || h.hour_number}
                  className="flex flex-col gap-2 p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl transition-all hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {getHourIcon(h.hour_number)}
                      <span className="px-2 py-0.5 bg-[#7D53F6]/10 text-[#7D53F6] font-extrabold text-[10px] rounded-lg uppercase tracking-wider">
                        Hour {h.hour_number}
                      </span>
                    </div>
                    {calculateDuration(h.start_time, h.end_time) && (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Timer size={10} className="text-[#7D53F6]" />
                        {calculateDuration(h.start_time, h.end_time)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                        Start Time
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-2.5 flex items-center justify-center">
                          {getHourIcon(h.hour_number, "text-slate-400 pointer-events-none", 11)}
                        </div>
                        <input
                          type="text"
                          value={h.start_time}
                          onChange={(e) => handleHourTimeChange(i, 'start_time', e.target.value)}
                          placeholder="e.g. 09:00 AM"
                          required
                          disabled={hoursLoading}
                          className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all duration-150"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                        End Time
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-2.5 flex items-center justify-center">
                          {getHourIcon(h.hour_number, "text-slate-400 pointer-events-none", 11)}
                        </div>
                        <input
                          type="text"
                          value={h.end_time}
                          onChange={(e) => handleHourTimeChange(i, 'end_time', e.target.value)}
                          placeholder="e.g. 10:00 AM"
                          required
                          disabled={hoursLoading}
                          className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl focus:outline-none focus:border-[#7D53F6] focus:ring-2 focus:ring-[#7D53F6]/20 transition-all duration-150"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={hoursLoading}
                className="w-full py-2.5 bg-[#7D53F6] hover:bg-[#683cdb] text-white rounded-xl font-extrabold text-xs tracking-widest uppercase cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-[#7D53F6]/15 hover:shadow-[#7D53F6]/25 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {hoursLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Timeslots Config</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default SessionDetails;
