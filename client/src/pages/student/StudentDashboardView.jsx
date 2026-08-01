import React, { useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Percent, CheckCircle, XCircle, TrendingUp, Clock, Calendar, User, ArrowRight } from 'lucide-react';

function StudentDashboardView() {
  const { records = [] } = useOutletContext();
  const navigate = useNavigate();

  // Dummy statistics as requested (97% attendance rate, min 80% target)
  const stats = {
    percentage: 97,
    presentCount: 39,
    absentCount: 1,
    target: 80
  };

  // Trend data points for the big impressive graph (8 weeks)
  const trendData = [
    { label: 'Wk 1', pct: 88 },
    { label: 'Wk 2', pct: 92 },
    { label: 'Wk 3', pct: 90 },
    { label: 'Wk 4', pct: 95 },
    { label: 'Wk 5', pct: 94 },
    { label: 'Wk 6', pct: 98 },
    { label: 'Wk 7', pct: 96 },
    { label: 'Wk 8', pct: 97 }
  ];

  // Helper to map graph points for a larger viewport (800x200)
  const graphPoints = useMemo(() => {
    const width = 800;
    const height = 200;
    const paddingX = 40;
    const paddingY = 30;
    
    const points = trendData.map((d, index) => {
      const x = paddingX + (index * (width - paddingX * 2) / (trendData.length - 1));
      // Map percentage (40% - 100%) to Y height
      const y = height - paddingY - ((d.pct - 40) * (height - paddingY * 2) / 60);
      return { x, y, label: d.label, pct: d.pct };
    });

    const linePath = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${points[0].x.toFixed(1)},${height - paddingY} ` + linePath + ` ${points[points.length - 1].x.toFixed(1)},${height - paddingY}`;

    return { points, linePath, areaPath, width, height, paddingX, paddingY };
  }, [trendData]);

  return (
    <div className="space-y-5 py-1 animate-fadeIn flex-grow flex flex-col min-h-0">
      {/* Top Section: 3 Header Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
        
        {/* Attendance Rate (97% Dummy, Target 80%) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Attendance Rate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#7D53F6]">
                {stats.percentage}%
              </span>
              <span className="text-[10px] font-bold text-slate-400">Target: {stats.target}% min</span>
            </div>
            {/* Tiny progress bar */}
            <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className="h-full rounded-full bg-[#7D53F6]"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
          <div className="bg-[#7D53F6]/5 text-[#7D53F6] border border-[#7D53F6]/10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
            <Percent size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Present Sessions (39 sessions) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Present Sessions</span>
            <span className="text-3xl font-black text-emerald-600 block leading-tight">
              {stats.presentCount} <span className="text-xs font-bold text-slate-400">sessions</span>
            </span>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Attendance Confirmed</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Absent Sessions (1 session) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Absent Sessions</span>
            <span className="text-3xl font-black text-rose-600 block leading-tight">
              {stats.absentCount} <span className="text-xs font-bold text-slate-400">session</span>
            </span>
            <p className="text-[9px] text-rose-400 font-bold uppercase tracking-wider">Absent</p>
          </div>
          <div className="bg-rose-50 text-rose-600 border border-rose-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
            <XCircle size={20} className="stroke-[2.5]" />
          </div>
        </div>

      </div>

      {/* Main Layout Area: Big Graph (left) & Quick Actions (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-grow min-h-0">
        
        {/* Big Graph Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 lg:col-span-9 flex flex-col justify-between flex-grow min-h-0">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[#7D53F6]" />
              <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest">Attendance Performance History</h3>
            </div>
            <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-500 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
              Weekly Timeline (W1 - W8)
            </span>
          </div>

          {/* Big Custom SVG Chart Container */}
          <div className="w-full mt-4 relative flex-grow min-h-[220px]">
            <svg 
              viewBox={`0 0 ${graphPoints.width} ${graphPoints.height}`} 
              className="w-full h-full overflow-visible"
            >
              {/* Defs for chart gradient area */}
              <defs>
                <linearGradient id="bigChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7D53F6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#7D53F6" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Horizontal Dotted Grid lines */}
              <line x1="40" y1="30" x2="760" y2="30" stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="5,5" />
              <line x1="40" y1="76.6" x2="760" y2="76.6" stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="5,5" />
              <line x1="40" y1="123.3" x2="760" y2="123.3" stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="5,5" />
              <line x1="40" y1="170" x2="760" y2="170" stroke="#E2E8F0" strokeWidth="1.5" />

              {/* Y Axis percentage markers */}
              <text x="12" y="33" className="text-[9px] font-extrabold fill-slate-400">100%</text>
              <text x="18" y="80" className="text-[9px] font-extrabold fill-slate-400">80%</text>
              <text x="18" y="127" className="text-[9px] font-extrabold fill-slate-400">60%</text>
              <text x="18" y="173" className="text-[9px] font-extrabold fill-slate-400">40%</text>

              {/* Gradient Area Fill under the line */}
              <polygon points={graphPoints.areaPath} fill="url(#bigChartGradient)" />

              {/* Smooth curve line */}
              <polyline 
                fill="none" 
                stroke="#7D53F6" 
                strokeWidth="3" 
                strokeLinecap="round"
                strokeLinejoin="round"
                points={graphPoints.linePath} 
              />

              {/* Interactive Circles & Labels */}
              {graphPoints.points.map((p, idx) => (
                <g key={idx} className="group cursor-pointer">
                  {/* Point Ring outer glowing boundary */}
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="6" 
                    fill="#7D53F6" 
                    fillOpacity="0.15" 
                    className="hover:scale-125 transition-transform duration-100"
                  />
                  {/* Point Ring center */}
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="3.5" 
                    fill="#FFFFFF" 
                    stroke="#7D53F6" 
                    strokeWidth="2.5" 
                  />
                  {/* Floating percentage values on top of points */}
                  <text 
                    x={p.x} 
                    y={p.y - 12} 
                    textAnchor="middle" 
                    className="text-[10px] font-black fill-[#7D53F6] tracking-tight bg-white"
                  >
                    {p.pct}%
                  </text>
                  {/* X Axis labels */}
                  <text 
                    x={p.x} 
                    y={graphPoints.height - 8} 
                    textAnchor="middle" 
                    className="text-[9px] font-extrabold fill-slate-500 uppercase tracking-wide"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Quick Navigation Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 lg:col-span-3 flex flex-col justify-between space-y-5 flex-grow min-h-0">
          <div className="space-y-4">
            <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Clock size={14} className="text-[#7D53F6]" />
              Quick Navigation
            </h3>
            
            {/* Nav Menu Actions */}
            <div className="space-y-2">
              <button
                onClick={() => navigate('/student/otp')}
                className="w-full py-3 px-4 bg-[#7D53F6]/5 hover:bg-[#7D53F6]/10 border border-[#7D53F6]/10 text-[#7D53F6] rounded-xl font-extrabold text-xs text-left flex items-center justify-between cursor-pointer transition-all duration-150 group"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle size={15} />
                  <span>Mark Attendance</span>
                </span>
                <ArrowRight size={13} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/student/history')}
                className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-600 rounded-xl font-extrabold text-xs text-left flex items-center justify-between cursor-pointer transition-all duration-150 group"
              >
                <span className="flex items-center gap-2">
                  <Calendar size={15} className="text-slate-400" />
                  <span>Attendance History</span>
                </span>
                <ArrowRight size={13} className="opacity-40 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/student/profile')}
                className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-600 rounded-xl font-extrabold text-xs text-left flex items-center justify-between cursor-pointer transition-all duration-150 group"
              >
                <span className="flex items-center gap-2">
                  <User size={15} className="text-slate-400" />
                  <span>View Profile Settings</span>
                </span>
                <ArrowRight size={13} className="opacity-40 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Security Policy</span>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              Attendance records are locked behind geofenced boundary checks. Ensure GPS accuracy.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default StudentDashboardView;
