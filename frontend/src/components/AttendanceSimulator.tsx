import React from 'react';
import { Sliders, Sparkles, TrendingUp, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface AttendanceSimulatorProps {
  currentAttendance: number;
  onSimulate: (percentage: number) => void;
  predictedDemand: number;
  capacity: number;
  riskLevel: 'SAFE' | 'MODERATE' | 'HIGH';
  isCompact?: boolean;
}

export const AttendanceSimulator: React.FC<AttendanceSimulatorProps> = ({
  currentAttendance,
  onSimulate,
  predictedDemand,
  capacity,
  riskLevel,
  isCompact = false
}) => {
  const presets = [
    { label: '70% Rain / Sparse', pct: 70, tag: 'MODERATE' },
    { label: '80% Normal Tuesday', pct: 80, tag: 'SAFE' },
    { label: '90% Lab Day', pct: 90, tag: 'HIGH' },
    { label: '94% Current Peak', pct: 94, tag: 'OVERCROWDED' },
    { label: '98% Mid-Term Exams', pct: 98, tag: 'CRITICAL' }
  ];

  const occupancyPct = Math.round((predictedDemand / capacity) * 100);

  if (isCompact) {
    return (
      <div className="bg-gradient-to-r from-sky-50 via-white to-blue-50/80 text-slate-800 p-3 rounded-xl border border-sky-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-sky-900">
            Attendance Simulator:
          </span>
          <span className="text-xs font-mono font-bold bg-sky-100 px-2 py-0.5 rounded text-sky-900 border border-sky-300">
            {currentAttendance}% Attendance
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {presets.map((p) => (
            <button
              key={p.pct}
              onClick={() => onSimulate(p.pct)}
              className={`text-xs px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                currentAttendance === p.pct
                  ? 'bg-sky-600 text-white font-bold ring-2 ring-sky-300 shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-sky-50 hover:text-sky-900 border border-slate-200'
              }`}
            >
              {p.pct}%
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-600">Route 1 AI Forecast:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
              riskLevel === 'HIGH'
                ? 'bg-red-100 text-red-800 border border-red-300'
                : riskLevel === 'MODERATE'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}
          >
            {predictedDemand} / {capacity} ({occupancyPct}%) • {riskLevel}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-sky-200 p-5 shadow-xs relative overflow-hidden card-hover">
      <div className="absolute top-0 right-0 bg-sky-100 text-sky-800 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider border-b border-l border-sky-200 flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-sky-600" />
        Simulated AI Prediction Loop
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
              Attendance Demand Simulator
            </h3>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
              Interactive What-If Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 break-anywhere">
            Test how real-time classroom attendance percentages propagate into the AI bus overcrowding model.
          </p>
        </div>

        {/* Live Outcome Badge */}
        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <div className="text-left sm:text-right">
            <p className="text-[11px] text-slate-400 font-medium">Route 1 Predicted Occupancy</p>
            <p className="text-base sm:text-lg font-extrabold text-slate-900 font-mono">
              {predictedDemand} <span className="text-xs font-normal text-slate-500">/ {capacity} seats</span>
              <span className={`ml-2 text-sm font-bold ${riskLevel === 'HIGH' ? 'text-red-600' : riskLevel === 'MODERATE' ? 'text-amber-600' : 'text-emerald-600'}`}>
                ({occupancyPct}%)
              </span>
            </p>
          </div>
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            riskLevel === 'HIGH' ? 'bg-red-50 border-red-200 text-red-600' : riskLevel === 'MODERATE' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}>
            {riskLevel === 'HIGH' ? <AlertTriangle className="w-6 h-6 animate-bounce" /> : riskLevel === 'MODERATE' ? <TrendingUp className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700">Simulate Overall Campus Attendance:</span>
          <span className="text-sky-800 font-mono text-sm bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-bold">
            {currentAttendance}% Attendance
          </span>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min="60"
          max="99"
          value={currentAttendance}
          onChange={(e) => onSimulate(Number(e.target.value))}
          className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 min-h-[44px]"
        />

        {/* Quick Preset Buttons (min 44px touch targets) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
          {presets.map((p) => {
            const isSelected = currentAttendance === p.pct;
            return (
              <button
                key={p.pct}
                onClick={() => onSimulate(p.pct)}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-left border transition-all text-xs flex flex-col justify-center cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/90 shadow-xs ring-1 ring-sky-400 font-bold'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-sky-50/50 hover:border-sky-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 font-mono text-sm">{p.pct}%</span>
                  <span className={`text-[9px] font-bold px-1 rounded shrink-0 ${
                    p.tag === 'CRITICAL' || p.tag === 'OVERCROWDED' ? 'bg-red-100 text-red-700' : p.tag === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {p.tag}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.label}</p>
              </button>
            );
          })}
        </div>

        {/* Attendance-to-Transit Pipeline Indicator */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2 bg-slate-50 p-2.5 rounded-xl overflow-x-auto touch-scroll">
          <div className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-700">
            <span>Flow:</span>
            <span className="text-blue-700 font-bold whitespace-nowrap">ATTENDANCE ({currentAttendance}%)</span>
            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-indigo-700 font-bold whitespace-nowrap">TRAVEL INFLUX</span>
            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-purple-700 font-bold whitespace-nowrap">ROUTE 1 DEMAND ({predictedDemand})</span>
            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className={`font-bold whitespace-nowrap ${riskLevel === 'HIGH' ? 'text-red-600' : 'text-emerald-600'}`}>
              {riskLevel === 'HIGH' ? 'OVERCROWD RISK ⚠' : 'BALANCED OCCUPANCY ✓'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 italic">
            Dynamic inference refreshed in &lt;12ms
          </span>
        </div>
      </div>
    </div>
  );
};
