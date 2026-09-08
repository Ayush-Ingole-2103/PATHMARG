import React, { useState } from 'react';
import { DriverDispatchModal } from './DriverDispatchModal';
import { PredictiveRiskPanel } from './PredictiveRiskPanel';

export default function PathmargDashboard() {
  const [isDispatchModalOpen, setDispatchModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      
      {/* Control Bar Button to trigger Modal */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button 
          onClick={() => setDispatchModalOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition"
        >
          💬 Open Dispatcher Console
        </button>
      </div>

      {/* Floating AI Risk Panel on Map Overlay */}
      <div className="absolute top-16 right-4 z-10">
        <PredictiveRiskPanel />
      </div>

      {/* Dispatch Modal Component */}
      <DriverDispatchModal 
        isOpen={isDispatchModalOpen} 
        onClose={() => setDispatchModalOpen(false)} 
      />
    </div>
  );
}