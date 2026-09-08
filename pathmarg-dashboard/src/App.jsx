import React, { useState } from 'react';
import { CommandHeader } from './CommandHeader';
import { InteractiveFleetSidebar } from './InteractiveFleetSidebar';
import { PredictiveRiskPanel } from './PredictiveRiskPanel';
import { DriverDispatchModal } from './DriverDispatchModal';
import DigitalTwinDashboard from './DigitalTwinDashboard';
import { useDigitalTwin } from './useDigitalTwin'; // Import the custom hook

export default function App() {
  // 1. Initialize the custom backend hook INSIDE the component body
  const {
    vehicles,
    hazardZones,
    systemState,
    isConnected,
    toggleEmergencyMode,
    rerouteVehicle,
  } = useDigitalTwin();

  // 2. Local UI States
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [selectedFleetId, setSelectedFleetId] = useState('TRK-402');
  const [showAIPanel, setShowAIPanel] = useState(true);

  // Sync emergency mode state directly with backend systemState
  const isEmergency = systemState.emergency_mode;

  return (
    <div
      className={`relative flex h-screen w-screen flex-col overflow-hidden bg-slate-950 font-sans text-slate-100 ${
        isEmergency ? 'ring-4 ring-rose-500/50' : ''
      }`}
    >
      {/* 1. Tactical Command Header */}
      <CommandHeader
        onOpenDispatch={() => setIsDispatchOpen(true)}
        emergencyMode={isEmergency}
        setEmergencyMode={(val) => toggleEmergencyMode(val)}
        isConnected={isConnected}
      />

      {/* 2. Main Workspace Layout */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Interactive Glassmorphic Fleet Sidebar */}
        <InteractiveFleetSidebar
          vehicles={vehicles}
          selectedFleetId={selectedFleetId}
          onSelectFleet={(id) => setSelectedFleetId(id)}
        />

        {/* Center Canvas / Map Layer */}
        <main className="relative flex-1 bg-slate-900">
          <DigitalTwinDashboard
            vehicles={vehicles}
            hazardZones={hazardZones}
            emergencyMode={isEmergency}
            selectedFleetId={selectedFleetId}
            onReroute={rerouteVehicle}
          />

          {/* Floating Toggle for PINN AI Panel */}
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className="absolute top-4 right-4 z-20 rounded-lg border border-violet-500/40 bg-slate-950/80 px-3 py-1.5 font-mono text-[11px] font-bold text-violet-300 backdrop-blur-md hover:border-violet-400 hover:bg-slate-900 transition"
          >
            {showAIPanel ? 'HIDE PINN AI' : 'SHOW PINN AI'}
          </button>

          {/* Floating PINN AI Predictive Risk Breakdown Panel */}
          {showAIPanel && (
            <div className="absolute top-14 right-4 z-20 transition-all duration-300">
              <PredictiveRiskPanel
                selectedFleetId={selectedFleetId}
                onReroute={() => rerouteVehicle(selectedFleetId)}
              />
            </div>
          )}
        </main>
      </div>

      {/* 3. Driver & Dispatch Direct Messaging Modal */}
      <DriverDispatchModal
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        selectedFleetId={selectedFleetId}
      />
    </div>
  );
}