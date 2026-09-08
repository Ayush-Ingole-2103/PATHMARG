import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Radio, 
  Cpu, 
  Activity, 
  Zap, 
  Layers, 
  Maximize2, 
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

export const CommandHeader = ({ onOpenDispatch, emergencyMode, setEmergencyMode }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toISOString().split('T')[1].slice(0, 8) + ' UTC');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-6 backdrop-blur-xl">
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

      {/* Brand & Regional Telemetry */}
      <div className="flex items-center gap-4 relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <Radio className="h-5 w-5 text-cyan-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-200 to-cyan-400 text-sm uppercase">
              PATHMARG DIGITAL TWIN
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono text-cyan-400 font-semibold tracking-wide">
              NE-COMMAND v3.1
            </span>
          </div>
          <p className="text-[11px] font-mono text-slate-400">
            LOGISTICS COMMAND & CONTROL • MEGHALAYA CORRIDOR
          </p>
        </div>
      </div>

      {/* Center Live Telemetry Status Ticker */}
      <div className="hidden lg:flex items-center gap-6 rounded-full border border-slate-800 bg-slate-900/60 px-5 py-1.5 backdrop-blur-md">
        <div className="flex items-center gap-2 border-r border-slate-800 pr-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono text-slate-300">GPS LINK: ACTIVE</span>
        </div>

        <div className="flex items-center gap-2 border-r border-slate-800 pr-4 text-[11px] font-mono">
          <Activity className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-slate-400">FPS:</span>
          <span className="text-cyan-300 font-bold">60.0</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <Cpu className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-slate-400">PINN MODEL:</span>
          <span className="text-violet-300 font-bold">NOMINAL</span>
        </div>
      </div>

      {/* Right Controls & Actions */}
      <div className="flex items-center gap-3 relative">
        {/* Real-time Clock */}
        <div className="hidden sm:block text-right pr-2">
          <div className="font-mono text-xs font-bold text-slate-200 tracking-wider">{time}</div>
          <div className="text-[10px] text-slate-400 font-mono">LATENCY: 12ms</div>
        </div>

        {/* Dispatcher Modal Trigger */}
        <button
          onClick={onOpenDispatch}
          className="flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.1)] hover:bg-cyan-500/20 hover:border-cyan-400 transition-all active:scale-95"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>DISPATCH</span>
        </button>

        {/* Emergency Mode Toggle */}
        <button
          onClick={() => setEmergencyMode(!emergencyMode)}
          className={`flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase transition-all duration-300 active:scale-95 ${
            emergencyMode
              ? 'border-rose-500 bg-rose-500/20 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse'
              : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-rose-500/50 hover:text-rose-400'
          }`}
        >
          <AlertTriangle className={`h-3.5 w-3.5 ${emergencyMode ? 'text-rose-400' : 'text-slate-400'}`} />
          <span>{emergencyMode ? 'EMERGENCY ACTIVE' : 'EMERGENCY MODE'}</span>
        </button>
      </div>
    </header>
  );
};