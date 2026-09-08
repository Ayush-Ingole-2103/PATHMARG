# main.py
from pinn_engine import SlopePhysicsEngine
from rerouter import OSRMRerouter
import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from schemas import Vehicle, HazardZone, SystemState
from typing import List

app = FastAPI(title="Pathmarg Digital Twin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MOCK_VEHICLES = [
    {
        "id": "TRK-711",
        "name": "Vaccines (2,400 doses)",
        "status": "EN ROUTE",
        "speed_kmh": 55.0,
        "temp_celsius": 4.2,
        "eta_hours": "4h 12m",
        "origin": "Shillong",
        "destination": "Silchar",
        "coordinates": [91.8933, 25.5788],
        "route_path": [[91.8933, 25.5788], [92.2000, 25.3000], [92.7876, 24.8170]]
    },
    {
        "id": "TRK-402",
        "name": "Perishable Produce",
        "status": "EN ROUTE",
        "speed_kmh": 42.0,
        "temp_celsius": 22.1,
        "eta_hours": "4h 45m",
        "origin": "Shillong",
        "destination": "Silchar",
        "coordinates": [92.1500, 25.2500],
        "route_path": [[91.8933, 25.5788], [92.1500, 25.2500], [92.7876, 24.8170]]
    },
    {
        "id": "TRK-320",
        "name": "Essential Medical Supplies",
        "status": "EN ROUTE",
        "speed_kmh": 61.0,
        "temp_celsius": 18.5,
        "eta_hours": "3h 50m",
        "origin": "Shillong",
        "destination": "Silchar",
        "coordinates": [91.9500, 25.4500],
        "route_path": [[91.8933, 25.5788], [91.9500, 25.4500], [92.7876, 24.8170]]
    }
]

MOCK_HAZARD_ZONES = [
    {
        "id": "HZ-101",
        "name": "NH-44 Landslide Risk Area",
        "severity": "HIGH",
        "coordinates": [
            [92.05, 25.20],
            [92.35, 25.20],
            [92.35, 25.45],
            [92.05, 25.45],
            [92.05, 25.20]
        ]
    }
]

SYSTEM_STATE = {
    "gps_link": "ACTIVE",
    "fps": 60.0,
    "pinn_model_status": "NOMINAL",
    "emergency_mode": False
}

@app.get("/api/system-state", response_model=SystemState)
def get_system_state():
    return SYSTEM_STATE

@app.get("/api/vehicles", response_model=List[Vehicle])
def get_vehicles():
    return MOCK_VEHICLES

@app.get("/api/hazard-zones", response_model=List[HazardZone])
def get_hazard_zones():
    return MOCK_HAZARD_ZONES

# Update the WebSocket endpoint in main.py
@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    step = 0
    simulated_rainfall = 40.0 # Start with mild rain

    try:
        while True:
            step += 0.002
            simulated_rainfall += 0.5 # Rain intensity increases every second

            # 1. Update TRK-402 coordinates along path
            MOCK_VEHICLES[1]["coordinates"][0] = 92.1500 + step
            MOCK_VEHICLES[1]["coordinates"][1] = 25.2500 - (step * 0.5)

            # 2. Automatically run PINN Landslide Model when rain rises
            pinn_eval = SlopePhysicsEngine.predict_landslide_risk({
                "slope_angle_deg": 48.0,
                "cohesion_kpa": 8.0,
                "friction_angle_deg": 22.0,
                "rainfall_mm_24h": simulated_rainfall
            })

            # Update Hazard Box if PINN detects failure
            if pinn_eval["hazard_zone_triggered"]:
                MOCK_HAZARD_ZONES[0]["severity"] = pinn_eval["risk_level"]
                MOCK_HAZARD_ZONES[0]["name"] = f"NH-6 Landslide Risk (FoS: {pinn_eval['factor_of_safety']})"

            # 3. Broadcast real-time packet to dashboard
            payload = {
                "type": "TELEMETRY_UPDATE",
                "systemState": SYSTEM_STATE,
                "vehicles": MOCK_VEHICLES,
                "hazardZones": MOCK_HAZARD_ZONES,
                "telemetry": {
                    "rainfall_mm": round(simulated_rainfall, 1),
                    "pinn_risk": pinn_eval
                }
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(1.0)
            
    except WebSocketDisconnect:
        print("Client disconnected from telemetry stream")
        # --- PINN INFERENCE ENDPOINT ---
@app.post("/api/pinn/evaluate")
def evaluate_slope_stability(payload: dict):
    """
    Evaluates physical slope conditions on NH-6 corridor 
    and updates hazard zones dynamically.
    """
    analysis = SlopePhysicsEngine.predict_landslide_risk(payload)
    
    # If PINN flags failure risk (FoS < 1.2), automatically trigger map hazard overlay
    if analysis["hazard_zone_triggered"]:
        new_hazard = {
            "id": f"HZ-{len(MOCK_HAZARD_ZONES) + 101}",
            "name": f"NH-6 Landslide Risk (FoS: {analysis['factor_of_safety']})",
            "severity": analysis["risk_level"],
            "coordinates": [
                [92.05, 25.20],
                [92.35, 25.20],
                [92.35, 25.45],
                [92.05, 25.45],
                [92.05, 25.20]
            ]
        }
        # Update active hazard zones served to the frontend map
        MOCK_HAZARD_ZONES[0] = new_hazard

    return {
        "status": "success",
        "pinn_output": analysis,
        "active_hazards": MOCK_HAZARD_ZONES
    }


# --- OSRM REROUTING ENDPOINT ---
@app.post("/api/vehicles/{vehicle_id}/reroute")
def reroute_vehicle(vehicle_id: str):
    """
    Recalculates route for a specific vehicle when 'Reroute via OSRM' is clicked.
    """
    for vehicle in MOCK_VEHICLES:
        if vehicle["id"] == vehicle_id:
            res = OSRMRerouter.calculate_alternative_route(
                current_coords=vehicle["coordinates"],
                destination_coords=[92.7876, 24.8170]
            )
            # Update vehicle route and status
            vehicle["route_path"] = res["route_path"]
            vehicle["status"] = "REROUTED (BYPASS)"
            vehicle["eta_hours"] = f"{int(res['duration_min'] // 60)}h {int(res['duration_min'] % 60)}m"
            
            return {
                "status": "success",
                "vehicle_id": vehicle_id,
                "rerouted_info": res,
                "updated_vehicle": vehicle
            }
            
    return {"status": "error", "message": "Vehicle not found"}