# rerouter.py
import urllib.request
import json

class OSRMRerouter:
    """
    Handles dynamic route recalculation using OSRM public API 
    or fallback bypass waypoints (via Jowai - Haflong Corridor).
    """
    
    # Standard route: Shillong -> Jowai -> Sonapur -> Silchar
    DEFAULT_ROUTE = [
        [91.8933, 25.5788], # Shillong
        [92.2000, 25.4500], # Jowai
        [92.3500, 25.1000], # Sonapur (Hazard Zone)
        [92.7876, 24.8170]  # Silchar
    ]
    
    # Safe Alternative Route bypassing NH-6 Landslide Zone (via Umrongso / Haflong Bypass)
    SAFE_BYPASS_ROUTE = [
        [91.8933, 25.5788], # Shillong
        [92.1000, 25.6000], # North Bypass
        [92.5500, 25.5000], # Umrongso Corridor
        [92.6800, 25.1500], # Haflong Link
        [92.7876, 24.8170]  # Silchar
    ]

    @classmethod
    def calculate_alternative_route(cls, current_coords: list, destination_coords: list) -> dict:
        """
        Attempts OSRM API lookup; falls back to pre-computed hazard bypass path.
        """
        start_str = f"{current_coords[0]},{current_coords[1]}"
        end_str = f"{destination_coords[0]},{destination_coords[1]}"
        osrm_url = f"http://router.project-osrm.org/route/v1/driving/{start_str};{end_str}?overview=full&geometries=geojson"
        
        try:
            req = urllib.request.Request(osrm_url, headers={'User-Agent': 'PathmargTwin/1.0'})
            with urllib.request.urlopen(req, timeout=3) as response:
                data = json.loads(response.read().decode())
                if data.get("code") == "Ok" and len(data.get("routes", [])) > 0:
                    route_path = data["routes"][0]["geometry"]["coordinates"]
                    return {
                        "status": "success",
                        "source": "OSRM_ONLINE",
                        "route_path": route_path,
                        "distance_km": round(data["routes"][0]["distance"] / 1000.0, 1),
                        "duration_min": round(data["routes"][0]["duration"] / 60.0, 1)
                    }
        except Exception as e:
            print(f"[OSRM] Fallback to local bypass due to: {e}")

        # Fallback return
        return {
            "status": "success",
            "source": "PATHMARG_HAZARD_BYPASS",
            "route_path": cls.SAFE_BYPASS_ROUTE,
            "distance_km": 215.4,
            "duration_min": 310.0
        }