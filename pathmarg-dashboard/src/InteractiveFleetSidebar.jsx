import React, { useState } from 'react';
import { Truck, ShieldCheck, AlertOctagon, Navigation2, ChevronRight, Fuel, Gauge } from 'lucide-react';

export const InteractiveFleetSidebar = ({ fleets = [], selectedFleetId, onSelectFleet }) => {
  const [collapsed, setCollapsed] = useState(false);

  const fleetData = fleets.length > 0 ? fleets : [
    { id: 'TRK-911', cargo: 'Vaccines (2,400 Doses)', route: 'Guwahati → Aizawl', status: 'OPTIMAL', eta: '4h 12m', fuel: '84%', speed: '58 km/h' },
    { id: 'TRK-402', cargo: 'Perishable Produce', route: 'Shillong → Silchar', status: 'REROUTED', eta: '6h 45m', fuel: '62%', speed: '42 km/h' },
    { id: 'TRK-108', cargo: 'Essential Medical Supplies', route: 'Imphal → Kohima', status: 'REROUTED', eta: '5h 10m', fuel: '78%', speed: '35 km/h' }
  ];

  return (
    <aside className={`relative z-20 transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-80'} flex flex-col border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl`}>
      
      {/* Panel Header */}
      <div className="flex h-12 items-center justify-between border-b border-slate-800/80 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-cyan-400" />
            <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase">Live Fleet Status</h2>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
        >
          <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Fleet List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {fleetData.map((truck) => {
          const isSelected = selectedFleetId === truck.id;
          const isOptimal = truck.status === 'OPTIMAL';

          return (
            <div
              key={truck.id}
              onClick={() => onSelectFleet && onSelectFleet(truck.id)}
              className={`group cursor-pointer rounded-xl border p-3.5 transition-all duration-200 ${
                isSelected
                  ? 'border-cyan-500/60 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.12)]'
                  : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              {/* Card Title & Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-100 group-hover:text-cyan-300">
                    {truck.id}
                  </span>
                  {!collapsed && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
                      {truck.cargo}
                    </span>
                  )}
                </div>

                <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase tracking-wide border ${
                  isOptimal
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                }`}>
                  {isOptimal ? <ShieldCheck className="h-2.5 w-2.5" /> : <AlertOctagon className="h-2.5 w-2.5" />}
                  {!collapsed && truck.status}
                </span>
              </div>

              {!collapsed && (
                <>
                  <div className="mt-2 text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Navigation2 className="h-3 w-3 text-cyan-400 rotate-45" />
                    <span className="truncate">{truck.route}</span>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-slate-800/60 pt-2.5 text-[10px] font-mono">
                    <div className="rounded bg-slate-950/50 p-1.5 border border-slate-800/40">
                      <span className="text-slate-500 block text-[9px]">SPEED</span>
                      <span className="text-slate-200 font-bold flex items-center gap-0.5">
                        <Gauge className="h-2.5 w-2.5 text-cyan-400" /> {truck.speed}
                      </span>
                    </div>
                    <div className="rounded bg-slate-950/50 p-1.5 border border-slate-800/40">
                      <span className="text-slate-500 block text-[9px]">FUEL</span>
                      <span className="text-slate-200 font-bold flex items-center gap-0.5">
                        <Fuel className="h-2.5 w-2.5 text-amber-400" /> {truck.fuel}
                      </span>
                    </div>
                    <div className="rounded bg-slate-950/50 p-1.5 border border-slate-800/40">
                      <span className="text-slate-500 block text-[9px]">ETA</span>
                      <span className="text-slate-200 font-bold">{truck.eta}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};