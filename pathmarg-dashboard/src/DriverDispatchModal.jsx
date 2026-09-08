import React, { useState } from 'react';
import { MessageSquare, AlertTriangle, Send, X, CheckCircle2, ShieldAlert } from 'lucide-react';

export const DriverDispatchModal = ({ isOpen, onClose, activeFleets }) => {
  const [selectedTruck, setSelectedTruck] = useState(activeFleets?.[0]?.id || 'TRK-402');
  const [priority, setPriority] = useState('CRITICAL'); // 'NORMAL' | 'HIGH' | 'CRITICAL'
  const [message, setMessage] = useState('');
  const [sentStatus, setSentStatus] = useState(false);

  const presets = [
    "⚠️ REROUTE MANDATE: Take Umrongso Bypass immediately due to active NH-6 block.",
    "🌧️ WEATHER ALERT: High wind vectors detected ahead. Reduce speed to <30 km/h.",
    "🛑 EMERGENCY HALT: Pull over at nearest safe outpost (Sector 4)."
  ];

  const handleSend = (e) => {
    e.preventDefault();
    if (!message) return;
    setSentStatus(true);
    setTimeout(() => {
      setSentStatus(false);
      setMessage('');
      onClose();
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900/95 p-6 shadow-2xl text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">Dispatcher Telemetry Console</h3>
              <p className="text-xs text-slate-400">Direct encrypted link to driver vehicle units</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSend} className="mt-4 space-y-4">
          {/* Target Fleet Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Select Target Vehicle
            </label>
            <select
              value={selectedTruck}
              onChange={(e) => setSelectedTruck(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="TRK-402">TRK-402 (Perishable Produce) — [REROUTED]</option>
              <option value="TRK-108">TRK-108 (Essential Supplies) — [REROUTED]</option>
              <option value="TRK-911">TRK-911 (Vaccines 2,400 Doses) — [OPTIMAL]</option>
            </select>
          </div>

          {/* Priority Toggles */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Alert Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['NORMAL', 'HIGH', 'CRITICAL'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPriority(lvl)}
                  className={`py-1.5 rounded-md text-xs font-semibold tracking-wide border transition-all ${
                    priority === lvl
                      ? lvl === 'CRITICAL'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                        : lvl === 'HIGH'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Preset Quick Alert
            </label>
            <div className="space-y-1.5">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessage(preset)}
                  className="w-full text-left truncate rounded-md border border-slate-800 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Custom Dispatch Message
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type dispatch instructions or re-route parameters..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
              SATELLITE DOWNLINK: ACTIVE
            </span>
            <button
              type="submit"
              disabled={sentStatus || !message}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                sentStatus
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-50'
              }`}
            >
              {sentStatus ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> DISPATCHED
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> BROADCAST TO DRIVER
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};