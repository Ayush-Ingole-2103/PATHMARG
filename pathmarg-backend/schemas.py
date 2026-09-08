# schemas.py
from pydantic import BaseModel
from typing import List, Optional

# 1. Vehicle Card Data (Left Panel & Bottom-Right Widget)
class Vehicle(BaseModel):
    id: str                  # e.g., "TRK-402"
    name: str                # e.g., "Perishable Produce"
    status: str              # e.g., "EN ROUTE", "WARNING"
    speed_kmh: float         # e.g., 42.0
    temp_celsius: float      # e.g., 22.1
    eta_hours: str           # e.g., "4h 12m"
    origin: str              # e.g., "Shillong"
    destination: str         # e.g., "Silchar"
    coordinates: List[float] # [Longitude, Latitude] e.g., [92.20, 25.80]
    route_path: List[List[float]] # Array of [lng, lat] for green map path

# 2. Hazard Polygon Overlay (Red Bounding Area on Map)
class HazardZone(BaseModel):
    id: str
    name: str                # e.g., "Choke Point 2 - Landslide Risk"
    severity: str            # "HIGH", "CRITICAL"
    coordinates: List[List[float]] # Closed polygon [[lng, lat], ...]

# 3. System Status Header (Top Command Header)
class SystemState(BaseModel):
    gps_link: str            # "ACTIVE"
    fps: float               # 60.0
    pinn_model_status: str   # "NOMINAL"
    emergency_mode: bool     # False

# 4. Ticker Broadcast Event (Bottom Log Bar)
class LogEvent(BaseModel):
    timestamp: str
    tag: str                 # "GPS-UPDATE", "PINN-ALERT"
    message: str