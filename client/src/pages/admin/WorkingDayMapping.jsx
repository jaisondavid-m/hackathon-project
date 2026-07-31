import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, CheckCircle, Save, Info, RefreshCw } from 'lucide-react';
import { configService } from '../../api/config';
import InputField from '../../components/InputField';

function WorkingDayMapping() {
  const [holidays, setHolidays] = useState([]);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  
  // Mode selection: 'single' or 'batch'
  const [mode, setMode] = useState('single');

  // Single mode states
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // Batch mode states
  const [batchStartDate, setBatchStartDate] = useState(null);
  const [batchEndDate, setBatchEndDate] = useState(null);

  // Status configuration: 'holiday', 'half-day', 'working'
  const [statusType, setStatusType] = useState('holiday');
  const [reasonName, setReasonName] = useState('');

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
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getHolidayConfig = (dateStr) => {
    return holidays.find((h) => h.date === dateStr);
  };

  const handleCalendarDayClick = (date) => {
    setHolidaySuccess('');
    setHolidayError('');

    if (mode === 'single') {
      setSelectedCalendarDate(date);
      const dateStr = formatDateString(date);
      const existingConfig = getHolidayConfig(dateStr);

      if (existingConfig) {
        if (existingConfig.is_holiday) {
          setStatusType('holiday');
        } else if (existingConfig.is_half_day) {
          setStatusType('half-day');
        } else {
          setStatusType('working');
        }
        setReasonName(existingConfig.name || '');
      } else {
        const isSunday = date.getDay() === 0;
        setStatusType(isSunday ? 'holiday' : 'working');
        setReasonName(isSunday ? 'Sunday - Default Holiday' : '');
      }
    } else {
      // Batch mode date selection flow
      if (!batchStartDate || (batchStartDate && batchEndDate)) {
        setBatchStartDate(date);
        setBatchEndDate(null);
      } else if (batchStartDate && !batchEndDate) {
        if (date < batchStartDate) {
          setBatchEndDate(batchStartDate);
          setBatchStartDate(date);
        } else {
          setBatchEndDate(date);
        }
      }
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    setHolidaySuccess('');
    setHolidayError('');

    if (mode === 'single') {
      if (!selectedCalendarDate) return;
      setHolidayLoading(true);
      const dateStr = formatDateString(selectedCalendarDate);

      const payload = {
        date: dateStr,
        name: statusType === 'working' ? '' : reasonName,
        is_holiday: statusType === 'holiday',
        is_half_day: statusType === 'half-day'
      };

      try {
        const savedOverride = await configService.saveHoliday(payload);
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
    } else {
      if (!batchStartDate || !batchEndDate) {
        setHolidayError('Please select both start and end dates.');
        return;
      }
      setHolidayLoading(true);

      const payload = {
        start_date: formatDateString(batchStartDate),
        end_date: formatDateString(batchEndDate),
        name: statusType === 'working' ? '' : reasonName,
        is_holiday: statusType === 'holiday',
        is_half_day: statusType === 'half-day'
      };

      try {
        await configService.saveHolidayBatch(payload);
        setHolidaySuccess('Batch calendar overrides applied successfully!');
        
        // Refresh full list from database to verify all states are in sync
        const holidaysData = await configService.getHolidays();
        setHolidays(holidaysData);

        // Reset batch dates
        setBatchStartDate(null);
        setBatchEndDate(null);
        setReasonName('');
      } catch (err) {
        setHolidayError('Failed to apply batch calendar overrides.');
      } finally {
        setHolidayLoading(false);
      }
    }
  };

  const resetBatchSelection = () => {
    setBatchStartDate(null);
    setBatchEndDate(null);
    setHolidaySuccess('');
    setHolidayError('');
  };

  // Render Calendar Month Grid (memoized)
  const daysInMonth = useMemo(() => getDaysInMonth(currentMonthDate), [currentMonthDate]);
  const firstDayIndex = useMemo(() => new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1).getDay(), [currentMonthDate]);
  const emptyDaysBefore = useMemo(() => Array.from({ length: firstDayIndex }), [firstDayIndex]);
  const monthName = useMemo(() => currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' }), [currentMonthDate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Monthly Calendar Grid Card */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-6 lg:col-span-7">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base leading-none">
              {monthName}
            </h3>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1.5">
              Click days to select {mode === 'batch' ? 'batch range bounds' : 'date'}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Day Labels */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 select-none">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {emptyDaysBefore.map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square" />
          ))}

          {daysInMonth.map((day) => {
            const dateStr = formatDateString(day);
            const existingConfig = getHolidayConfig(dateStr);
            const isSunday = day.getDay() === 0;

            // Highlight flags
            let isSelected = false;
            let isInRange = false;

            if (mode === 'single') {
              isSelected = selectedCalendarDate && formatDateString(selectedCalendarDate) === dateStr;
            } else {
              const startStr = formatDateString(batchStartDate);
              const endStr = formatDateString(batchEndDate);
              isSelected = (startStr === dateStr) || (endStr === dateStr);
              if (batchStartDate && batchEndDate) {
                isInRange = day >= batchStartDate && day <= batchEndDate;
              }
            }
            
            let cellBg = 'bg-slate-50/50 border-slate-100 text-slate-700';
            let statusDot = null;

            if (existingConfig) {
              if (existingConfig.is_holiday) {
                cellBg = 'bg-rose-50 border-rose-100 text-rose-700 font-extrabold shadow-sm';
                statusDot = <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />;
              } else if (existingConfig.is_half_day) {
                cellBg = 'bg-amber-50 border-amber-100 text-amber-700 font-extrabold shadow-sm';
                statusDot = <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />;
              } else {
                cellBg = 'bg-emerald-50 border-emerald-100 text-emerald-700 font-extrabold shadow-sm';
                statusDot = <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />;
              }
            } else if (isSunday) {
              cellBg = 'bg-rose-50/30 border-rose-50 text-rose-500/80 font-bold';
            }

            let borders = '';
            if (isSelected) {
              borders = 'border-2 border-[#7D53F6] ring-2 ring-[#7D53F6]/10 scale-105 font-black z-10';
            } else if (isInRange) {
              borders = 'border-2 border-dashed border-[#7D53F6]/50 bg-[#7D53F6]/5';
            }

            return (
              <button
                key={dateStr}
                onClick={() => handleCalendarDayClick(day)}
                className={`aspect-square border rounded-2xl flex flex-col items-center justify-center text-xs relative cursor-pointer hover:border-[#7D53F6] hover:scale-105 transition-all duration-150 ${cellBg} ${borders}`}
              >
                <span>{day.getDate()}</span>
                {statusDot}
              </button>
            );
          })}
        </div>

        {/* Legend Indicators */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-[9px] font-bold uppercase tracking-wider text-slate-400 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-md bg-rose-500" />
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-md bg-amber-500" />
            <span>Half Day (First Half)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-md bg-emerald-500" />
            <span>Working Day Override</span>
          </div>
        </div>
      </div>

      {/* Override Configuration Controls Panel */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-6 lg:col-span-5 space-y-5">
        
        {/* Selection Mode Toggle */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 select-none">
            Mapping Selection Mode
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
            <button
              onClick={() => {
                setMode('single');
                resetBatchSelection();
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                mode === 'single'
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-100'
                  : 'text-slate-400 hover:text-slate-700 cursor-pointer'
              }`}
            >
              Single Date
            </button>
            <button
              onClick={() => {
                setMode('batch');
                setSelectedCalendarDate(null);
                setReasonName('');
                setHolidaySuccess('');
                setHolidayError('');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                mode === 'batch'
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-100'
                  : 'text-slate-400 hover:text-slate-700 cursor-pointer'
              }`}
            >
              Date Range (Leave)
            </button>
          </div>
        </div>

        <h3 className="text-sm font-extrabold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Calendar size={16} className="text-[#7D53F6]" />
          <span>Apply Configuration</span>
        </h3>

        {/* Display selected dates/bounds */}
        {mode === 'single' ? (
          selectedCalendarDate ? (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block select-none">Selected Date</span>
              <span className="text-xs font-black text-slate-700 mt-1 block">
                {selectedCalendarDate.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center select-none">
              Click any calendar day below to select
            </div>
          )
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase block select-none">Start Date</span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">
                  {batchStartDate ? batchStartDate.toLocaleDateString() : 'Select Start'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase block select-none">End Date</span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">
                  {batchEndDate ? batchEndDate.toLocaleDateString() : 'Select End'}
                </span>
              </div>
            </div>
            {(batchStartDate || batchEndDate) && (
              <button
                onClick={resetBatchSelection}
                className="text-[9px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-widest block text-right w-full cursor-pointer"
              >
                Clear range selection
              </button>
            )}
          </div>
        )}

        {/* Form elements (rendered when dates are ready) */}
        {((mode === 'single' && selectedCalendarDate) || (mode === 'batch' && batchStartDate && batchEndDate)) ? (
          <form onSubmit={handleOverrideSubmit} className="space-y-4">
            {/* Status Type Selection */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 select-none">
                Calendar Day Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatusType('holiday')}
                  className={`py-2 text-[10px] font-extrabold uppercase rounded-xl border text-center cursor-pointer transition-colors focus:outline-none focus:ring-0 ${
                    statusType === 'holiday'
                      ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Holiday
                </button>
                <button
                  type="button"
                  onClick={() => setStatusType('half-day')}
                  className={`py-2 text-[10px] font-extrabold uppercase rounded-xl border text-center cursor-pointer transition-colors focus:outline-none focus:ring-0 ${
                    statusType === 'half-day'
                      ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Half Day
                </button>
                <button
                  type="button"
                  onClick={() => setStatusType('working')}
                  className={`py-2 text-[10px] font-extrabold uppercase rounded-xl border text-center cursor-pointer transition-colors focus:outline-none focus:ring-0 ${
                    statusType === 'working'
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Working Day
                </button>
              </div>
            </div>

            {/* Conditional input fields for label/reason: HIDE when statusType === 'working' */}
            {statusType !== 'working' && (
              <InputField
                label="Reason / Label"
                value={reasonName}
                onChange={(e) => setReasonName(e.target.value)}
                placeholder={statusType === 'half-day' ? "e.g. Mid-term Exam Half Day" : "e.g. Republic Day"}
                required
                disabled={holidayLoading}
              />
            )}

            {holidayError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{holidayError}</span>
              </div>
            )}

            {holidaySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-pulse">
                <CheckCircle size={16} />
                <span>{holidaySuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={holidayLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#7D53F6] hover:bg-[#683cdb] text-white text-xs font-extrabold tracking-widest uppercase rounded-2xl shadow-md shadow-[#7D53F6]/15 hover:shadow-[#7D53F6]/25 transition-all duration-200 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
            >
              {holidayLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  <span>{mode === 'single' ? 'Apply Override' : 'Apply Batch Overrides'}</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center gap-2 select-none">
            <Info size={24} className="text-slate-300" />
            <p className="text-[10px] font-semibold tracking-wider uppercase leading-snug px-6">
              {mode === 'single'
                ? 'Click any day in the calendar grid to configure holidays or working overrides.'
                : 'Click two days in the calendar grid to set bounds for batch range modifications.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkingDayMapping;
