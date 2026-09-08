import { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:8000/api';
const WS_URL = 'ws://localhost:8000/ws/telemetry';

export function useDigitalTwin() {
  const [vehicles, setVehicles] = useState([]);
  const [hazardZones, setHazardZones] = useState([]);
  const [systemState, setSystemState] = useState({
    gps_link: 'DISCONNECTED',
    fps: 0,
    pinn_model_status: 'OFFLINE',
    emergency_mode: false,
  });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  // 1. Fetch initial REST state
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [sysRes, vehRes, hazRes] = await Promise.all([
          fetch(`${API_BASE}/system-state`),
          fetch(`${API_BASE}/vehicles`),
          fetch(`${API_BASE}/hazard-zones`),
        ]);

        if (sysRes.ok) setSystemState(await sysRes.json());
        if (vehRes.ok) setVehicles(await vehRes.json());
        if (hazRes.ok) setHazardZones(await hazRes.json());
      } catch (err) {
        console.error('Error fetching initial backend state:', err);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Real-time WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'TELEMETRY_UPDATE') {
          if (data.vehicles) setVehicles(data.vehicles);
          if (data.systemState) setSystemState(data.systemState);
          if (data.hazardZones) setHazardZones(data.hazardZones);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = () => setIsConnected(false);

    return () => ws.close();
  }, []);

  // Helper 1: Toggle emergency mode
  const toggleEmergencyMode = async (enabled) => {
    try {
      const res = await fetch(`${API_BASE}/system-state/emergency-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergency_mode: enabled }),
      });
      const updated = await res.json();
      setSystemState((prev) => ({ ...prev, emergency_mode: updated.emergency_mode }));
    } catch (err) {
      console.error('Error toggling emergency mode:', err);
    }
  };

  // Helper 2: Trigger OSRM reroute for a vehicle
  const rerouteVehicle = async (vehicleId = 'TRK-402') => {
    try {
      const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/reroute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setVehicles((prev) =>
          prev.map((v) => (v.id === vehicleId ? data.updated_vehicle : v))
        );
      }
    } catch (err) {
      console.error('Error triggering reroute:', err);
    }
  };

  return {
    vehicles,
    hazardZones,
    systemState,
    isConnected,
    toggleEmergencyMode,
    rerouteVehicle,
  };
}
