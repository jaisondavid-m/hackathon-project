import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, CheckCircle, Save, Info } from 'lucide-react';
import { configService } from '../../api/config';
import InputField from '../../components/InputField';

function WorkingDayMapping() {
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

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setHolidayLoading(true);
      const holidaysData = await configService.getHolidays();
      setHolidays(holidaysData);
    } catch (err) {
      console.error('Failed to load holidays:', err);
      setHolidayError('Failed to load holiday overrides.');
    } finally {
      setHolidayLoading(false);
    }
  };

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Monthly Calendar Grid */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-6 lg:col-span-7">
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
      <div className="bg-white rounded-3xl border border-slate-100/80 p-6 lg:col-span-5">
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
                  className={`py-1.5 text-[10px] font-extrabold uppercase rounded-lg border text-center cursor-pointer transition-colors focus:outline-none focus:ring-0 ${
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
                  className={`py-1.5 text-[10px] font-extrabold uppercase rounded-lg border text-center cursor-pointer transition-colors focus:outline-none focus:ring-0 ${
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
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#7D53F6] hover:bg-[#683cdb] text-white text-xs font-bold rounded-lg shadow-sm transition-colors duration-200 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
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
  );
}

export default WorkingDayMapping;
