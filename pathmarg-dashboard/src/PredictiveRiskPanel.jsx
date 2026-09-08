import React from 'react';
import { Cpu, AlertTriangle, TrendingUp, Activity, Layers, Compass } from 'lucide-react';

export const PredictiveRiskPanel = () => {
  const timeWindows = [
    { hour: '3h Ahead', risk: 28, status: 'LOW' },
    { hour: '6h Ahead', risk: 42, status: 'MODERATE' },
    { hour: '12h Ahead', risk: 87, status: 'CRITICAL' },
    { hour: '18h Ahead', risk: 94, status: 'CRITICAL' },
    { hour: '24h Ahead', risk: 65, status: 'HIGH' }
  ];

  return (
    <div className="w-80 rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl text-slate-100 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-cyan-400 animate-pulse" />
          <h3 className="text-xs font-bold tracking-wider uppercase text-slate-200">
            PINN AI Risk Intelligence
          </h3>
        </div>
        <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-mono text-cyan-400">
          v2.4-Physics
        </span>
      </div>

      {/* Main Metric Card */}
      <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider">
            Peak Terrain Risk (12h-18h)
          </span>
          <AlertTriangle className="h-4 w-4 text-rose-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-black text-rose-400 font-mono">87.4%</span>
          <span className="text-xs text-rose-300 font-medium">Slope Failure Probability</span>
        </div>
        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
          <span>PINN Confidence:</span>
          <span className="font-mono text-slate-200">94.2% ($\pm 1.8\%$)</span>
        </div>
      </div>

      {/* 12-24h Timeline Forecast */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
          <span>12–24h Ahead Forecast</span>
          <TrendingUp className="h-3 w-3 text-cyan-400" />
        </div>
        <div className="space-y-2">
          {timeWindows.map((tw, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">{tw.hour}</span>
                <span className={
                  tw.risk > 75 ? 'text-rose-400 font-bold' :
                  tw.risk > 50 ? 'text-amber-400' : 'text-emerald-400'
                }>
                  {tw.risk}% [{tw.status}]
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    tw.risk > 75 ? 'bg-rose-500' :
                    tw.risk > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${tw.risk}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Physical Equation Factors */}
      <div className="mt-4 border-t border-slate-800 pt-3 space-y-2">
        <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
          Physics-Informed Variables
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded bg-slate-800/60 p-2 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Soil Saturation ($S_s$)</span>
            <span className="font-mono font-bold text-amber-400">0.91 / 1.0</span>
          </div>
          <div className="rounded bg-slate-800/60 p-2 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Shear Stress ($\tau$)</span>
            <span className="font-mono font-bold text-rose-400">42.8 kPa</span>
          </div>
        </div>
      </div>

      {/* Action Recommendation */}
      <div className="mt-3 rounded-md bg-cyan-950/40 border border-cyan-800/40 p-2 text-[11px] text-cyan-200">
        💡 <span className="font-semibold text-cyan-100">AI Recommendation:</span> Enforce Umrongso Corridor bypass for all heavy freight entering Meghalaya NH-6 after 14:00 hrs.
      </div>
    </div>
  );
};