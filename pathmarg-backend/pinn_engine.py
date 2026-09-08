# pinn_engine.py
import math

class SlopePhysicsEngine:
    """
    Evaluates slope stability using Infinite Slope Model physics constraints.
    Calculates Factor of Safety (FoS) and outputs landslide risk probability.
    """
    @staticmethod
    def calculate_factor_of_safety(
        slope_angle_deg: float,
        cohesion_kpa: float,
        friction_angle_deg: float,
        soil_depth_m: float = 2.5,
        unit_weight_knm3: float = 18.0,
        pore_pressure_ratio: float = 0.4
    ) -> float:
        beta = math.radians(slope_angle_deg)
        phi = math.radians(friction_angle_deg)
        gamma = unit_weight_knm3
        h = soil_depth_m
        ru = pore_pressure_ratio

        # Resisting shear strength forces vs driving shear stress forces
        driving_force = gamma * h * math.sin(beta) * math.cos(beta)
        if driving_force <= 0:
            return 3.0  # Stable

        resisting_force = cohesion_kpa + (gamma * h * (math.cos(beta)**2) - ru * gamma * h) * math.tan(phi)
        fos = resisting_force / driving_force
        return max(0.1, round(fos, 3))

    @classmethod
    def predict_landslide_risk(cls, params: dict) -> dict:
        fos = cls.calculate_factor_of_safety(
            slope_angle_deg=params.get("slope_angle_deg", 45.0),
            cohesion_kpa=params.get("cohesion_kpa", 10.0),
            friction_angle_deg=params.get("friction_angle_deg", 25.0),
            rainfall_mm_24h=params.get("rainfall_mm_24h", 120.0)
        )

        # High rainfall lowers FoS factor
        rainfall_mm = params.get("rainfall_mm_24h", 0.0)
        if rainfall_mm > 100:
            fos = max(0.1, fos - (rainfall_mm / 300.0))

        # Risk mapping from Factor of Safety (FoS < 1.0 indicates structural failure risk)
        if fos < 1.0:
            risk_level = "CRITICAL"
            risk_probability = min(0.99, round(1.0 - (fos / 2.0), 3))
        elif fos < 1.5:
            risk_level = "HIGH"
            risk_probability = round(1.0 - (fos / 2.0), 3)
        else:
            risk_level = "LOW"
            risk_probability = max(0.01, round(1.0 - (fos / 2.0), 3))

        return {
            "factor_of_safety": fos,
            "risk_level": risk_level,
            "risk_probability": risk_probability,
            "hazard_zone_triggered": fos < 1.2
        }