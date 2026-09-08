import React, { useState, useEffect, useMemo, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { FlyToInterpolator } from '@deck.gl/core';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { GeoJsonLayer, IconLayer, BitmapLayer, PathLayer, TextLayer, ScatterplotLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { 
  AlertTriangle, ShieldAlert, Truck, Activity, 
  CloudRain, Mountain, RefreshCw, X, Gauge, Fuel, User, 
  Clock, Thermometer, MapPin, Navigation, Sparkles, Loader2, CheckCircle2,
  Wind, Layers, Eye, EyeOff, Play, Pause, TrendingUp, ChevronUp, ChevronDown, Box, Radio
} from 'lucide-react';

const INITIAL_VIEW_STATE = {
  longitude: 92.4500,
  latitude: 25.3000,
  zoom: 8.2,
  pitch: 0,
  bearing: 0
};

const MAP_STYLE = {
  version: 8,
  sources: {
    'esri-dark': {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: '&copy; Esri, HERE, Garmin, USGS, NGA, EPA'
    }
  },
  layers: [
    {
      id: 'esri-dark-layer',
      type: 'raster',
      source: 'esri-dark',
      minzoom: 0,
      maxzoom: 16
    }
  ]
};

// Regional Weather Stations
const WEATHER_STATIONS = [
  { id: 'STN-1', name: 'Shillong Peak', coords: [91.8933, 25.5788], temp: 18.4, humidity: 92, status: 'Cool / Fog' },
  { id: 'STN-2', name: 'Jowai Junction', coords: [92.2000, 25.4400], temp: 20.1, humidity: 96, status: 'Heavy Rain' },
  { id: 'STN-3', name: 'Guwahati Hub', coords: [91.7362, 26.1158], temp: 29.5, humidity: 78, status: 'Humid' },
  { id: 'STN-4', name: 'Umrongso Valley', coords: [92.7000, 25.5000], temp: 23.8, humidity: 88, status: 'Overcast' },
  { id: 'STN-5', name: 'Silchar Station', coords: [92.7923, 24.8170], temp: 31.2, humidity: 84, status: 'Tropical Warm' },
  { id: 'STN-6', name: 'Tezpur North', coords: [92.7926, 26.6338], temp: 28.0, humidity: 80, status: 'Clear' },
  { id: 'STN-7', name: 'Imphal Basin', coords: [93.9368, 24.8170], temp: 24.2, humidity: 86, status: 'Passing Showers' }
];

// Haversine Distance helper (in km)
function getDistanceKm(coord1, coord2) {
  if (!coord1 || !coord2) return 0;
  const R = 6371;
  const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
  const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Polyline Interpolator helper
function interpolatePolyline(pathCoords, progressPct) {
  if (!pathCoords || pathCoords.length === 0) return [0, 0];
  if (pathCoords.length === 1) return pathCoords[0];

  let cumulativeDist = [0];
  let totalDist = 0;
  for (let i = 0; i < pathCoords.length - 1; i++) {
    const d = getDistanceKm(pathCoords[i], pathCoords[i + 1]);
    totalDist += d;
    cumulativeDist.push(totalDist);
  }

  if (totalDist === 0) return pathCoords[0];
  const targetDist = (progressPct / 100) * totalDist;

  for (let i = 0; i < cumulativeDist.length - 1; i++) {
    if (targetDist >= cumulativeDist[i] && targetDist <= cumulativeDist[i + 1]) {
      const segmentLen = cumulativeDist[i + 1] - cumulativeDist[i];
      const segmentRatio = segmentLen === 0 ? 0 : (targetDist - cumulativeDist[i]) / segmentLen;
      const p1 = pathCoords[i];
      const p2 = pathCoords[i + 1];
      return [
        p1[0] + (p2[0] - p1[0]) * segmentRatio,
        p1[1] + (p2[1] - p1[1]) * segmentRatio
      ];
    }
  }
  return pathCoords[pathCoords.length - 1];
}

// Elevation Profile Data Generator
function generateElevationProfile(pathCoords) {
  if (!pathCoords || pathCoords.length < 2) return [];

  let accumKm = 0;
  let points = [];

  for (let i = 0; i < pathCoords.length; i++) {
    if (i > 0) {
      accumKm += getDistanceKm(pathCoords[i - 1], pathCoords[i]);
    }
    const [lon, lat] = pathCoords[i];

    // Terrain Elevation Synthesis for Meghalaya / Assam Plateau Range
    let baseAlt = 80 + (lat - 24.5) * 1150 + Math.sin(lon * 8) * 280;
    let ridgeEffect = Math.sin(accumKm * 0.12) * 160 + Math.cos(accumKm * 0.35) * 85;
    let elevation = Math.round(Math.max(25, Math.min(1680, baseAlt + ridgeEffect)));

    points.push({
      distKm: parseFloat(accumKm.toFixed(1)),
      elevationM: elevation,
      coords: [lon, lat]
    });
  }

  // Calculate percentage slope grades
  for (let i = 0; i < points.length; i++) {
    if (i === 0) {
      points[i].slopePct = 0;
    } else {
      const deltaDistM = (points[i].distKm - points[i - 1].distKm) * 1000;
      const deltaAltM = points[i].elevationM - points[i - 1].elevationM;
      points[i].slopePct = deltaDistM > 0 ? parseFloat(((deltaAltM / deltaDistM) * 100).toFixed(1)) : 0;
    }
  }

  return points;
}

export default function DigitalTwinDashboard({ emergencyMode: propEmergencyMode, selectedFleetId, onSelectFleet }) {
  const [emergencyMode, setEmergencyMode] = useState(propEmergencyMode || false);
  const [enable3D, setEnable3D] = useState(false);
  const [radarTimestamp, setRadarTimestamp] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Live Simulation & UI State
  const [isSimulating, setIsSimulating] = useState(true);
  const [showElevationDrawer, setShowElevationDrawer] = useState(true);
  const [showWeatherMenu, setShowWeatherMenu] = useState(true);
  const [hoveredElevationPoint, setHoveredElevationPoint] = useState(null);
  const animFrameRef = useRef(null);

  // Sync Emergency Mode Prop
  useEffect(() => {
    if (propEmergencyMode !== undefined) {
      setEmergencyMode(propEmergencyMode);
    }
  }, [propEmergencyMode]);

  // Weather Overlay Controls
  const [showRadar, setShowRadar] = useState(true);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showWindVectors, setShowWindVectors] = useState(true);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  // Fleet dataset
  const [vehicles, setVehicles] = useState([
    { 
      id: 'TRK-901', 
      coordinates: [91.7362, 26.1158], 
      originName: 'Guwahati',
      originCoords: [91.7362, 26.1158],
      destName: 'Tezpur',
      destCoords: [92.7926, 26.6338],
      status: 'OPTIMAL', 
      cargo: 'Vaccines (2,400 Doses)', 
      temp: 4.2,
      driver: 'Rajesh Sharma',
      speed: '54 km/h',
      fuel: 82,
      route: 'Guwahati ➔ Tezpur',
      progress: 68,
      eta: '1h 20m',
      routeColor: [6, 182, 212],
      pathCoords: []
    },
    { 
      id: 'TRK-402', 
      coordinates: [91.8933, 25.5788], 
      originName: 'Shillong',
      originCoords: [91.8933, 25.5788],
      destName: 'Silchar',
      destCoords: [92.7923, 24.8170],
      status: 'WARNING', 
      cargo: 'Perishable Produce', 
      temp: 14.8,
      driver: 'Animesh Roy',
      speed: '32 km/h',
      fuel: 45,
      route: 'Shillong ➔ NH-6 (Hazard) ➔ Silchar',
      progress: 25,
      eta: '3h 10m',
      routeColor: [239, 68, 68],
      pathCoords: [],
      isRerouted: false
    },
    { 
      id: 'TRK-108', 
      coordinates: [93.9368, 24.8170], 
      originName: 'Imphal',
      originCoords: [93.9368, 24.8170],
      destName: 'Kohima',
      destCoords: [94.1086, 25.6751],
      status: 'REROUTED', 
      cargo: 'Essential Supplies', 
      temp: 6.0,
      driver: 'Bikram Thapa',
      speed: '40 km/h',
      fuel: 62,
      route: 'Imphal ➔ Kohima Bypass',
      progress: 40,
      eta: '2h 45m',
      routeColor: [168, 85, 247],
      pathCoords: []
    }
  ]);

  // Sync with selectedFleetId prop if changed from external sidebar
  useEffect(() => {
    if (selectedFleetId) {
      const match = vehicles.find(v => v.id === selectedFleetId);
      if (match && match.id !== selectedVehicle?.id) {
        handleSelectVehicle(match);
      }
    }
  }, [selectedFleetId]);

  // Landslide Danger Zone Polygon
  const hazardZones = useMemo(() => ({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { riskScore: 0.94, leadTime: '6h Landslide Alert', location: 'NH-6 Jaintia Hills' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[92.05, 25.05], [92.50, 25.05], [92.50, 25.45], [92.05, 25.45], [92.05, 25.05]]]
        }
      }
    ]
  }), []);

  // Generate Wind Field Vectors
  const windVectorData = useMemo(() => {
    const vectors = [];
    const startLon = 91.2, endLon = 94.2, stepLon = 0.5;
    const startLat = 24.5, endLat = 26.8, stepLat = 0.45;

    for (let lon = startLon; lon <= endLon; lon += stepLon) {
      for (let lat = startLat; lat <= endLat; lat += stepLat) {
        const angleDeg = 210 + Math.sin(lon * 4 + lat * 2) * 20;
        const speedKmH = Math.round(20 + Math.sin(lon * 3) * 12 + Math.cos(lat * 5) * 8);
        const angleRad = (angleDeg * Math.PI) / 180;
        
        const len = 0.16 * (speedKmH / 30);
        const endLonPoint = lon + len * Math.sin(angleRad);
        const endLatPoint = lat + len * Math.cos(angleRad);

        vectors.push({
          id: `wind-${lon.toFixed(1)}-${lat.toFixed(1)}`,
          start: [lon, lat],
          end: [endLonPoint, endLatPoint],
          path: [[lon, lat], [endLonPoint, endLatPoint]],
          speed: speedKmH,
          angle: Math.round(angleDeg)
        });
      }
    }
    return vectors;
  }, []);

  // Compute Active Elevation Profile for Selected Vehicle
  const activeElevationProfile = useMemo(() => {
    if (!selectedVehicle?.pathCoords || selectedVehicle.pathCoords.length < 2) return [];
    return generateElevationProfile(selectedVehicle.pathCoords);
  }, [selectedVehicle?.pathCoords]);

  // Fetch initial road paths for all trucks
  useEffect(() => {
    async function loadInitialRoutes() {
      const updatedVehicles = await Promise.all(vehicles.map(async (v) => {
        try {
          const startStr = `${v.originCoords[0]},${v.originCoords[1]}`;
          const destStr = `${v.destCoords[0]},${v.destCoords[1]}`;
          const url = `https://router.project-osrm.org/route/v1/driving/${startStr};${destStr}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();
          if (data?.routes?.[0]?.geometry?.coordinates) {
            const path = data.routes[0].geometry.coordinates;
            const startPos = interpolatePolyline(path, v.progress);
            return { ...v, pathCoords: path, coordinates: startPos };
          }
        } catch (e) {
          console.error(`Route fetch failed for ${v.id}:`, e);
        }
        return v;
      }));
      setVehicles(updatedVehicles);
      setSelectedVehicle(updatedVehicles[1]);
    }

    loadInitialRoutes();
  }, []);

  // GPS Smooth Interpolation Animation Loop
  useEffect(() => {
    if (!isSimulating) return;

    let lastTime = performance.now();

    const animateVehicles = (now) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      setVehicles(prevVehicles => {
        const updated = prevVehicles.map(v => {
          if (!v.pathCoords || v.pathCoords.length < 2) return v;

          let newProgress = v.progress + deltaSec * 1.2;
          if (newProgress > 100) newProgress = 0;

          const newCoords = interpolatePolyline(v.pathCoords, newProgress);

          return {
            ...v,
            progress: newProgress,
            coordinates: newCoords
          };
        });

        if (selectedVehicle) {
          const matched = updated.find(m => m.id === selectedVehicle.id);
          if (matched) setSelectedVehicle(matched);
        }

        return updated;
      });

      animFrameRef.current = requestAnimationFrame(animateVehicles);
    };

    animFrameRef.current = requestAnimationFrame(animateVehicles);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSimulating, selectedVehicle?.id]);

  // Weather Radar Cache Fetch
  useEffect(() => {
    async function fetchRadarData() {
      try {
        setLoadingWeather(true);
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await res.json();
        if (data?.radar?.past?.length > 0) {
          setRadarTimestamp(data.radar.past[data.radar.past.length - 1].time);
        }
      } catch (err) {
        console.error('Failed to fetch radar data:', err);
      } finally {
        setLoadingWeather(false);
      }
    }
    fetchRadarData();
  }, []);

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    if (onSelectFleet) onSelectFleet(vehicle.id);

    setViewState(prev => ({
      ...prev,
      longitude: vehicle.coordinates[0],
      latitude: vehicle.coordinates[1],
      zoom: 8.5,
      pitch: enable3D ? 60 : 30,
      transitionDuration: 1200,
      transitionInterpolator: new FlyToInterpolator()
    }));
  };

  const handleSimulateReroute = async () => {
    setIsCalculatingRoute(true);
    try {
      const origin = "91.8933,25.5788"; // Shillong
      const viaNorth = "92.3000,25.5500"; 
      const viaUmrongso = "92.7000,25.5000"; // Umrongso Corridor
      const viaHarangajao = "92.8500,25.1000"; 
      const destination = "92.7923,24.8170"; // Silchar Target
      
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin};${viaNorth};${viaUmrongso};${viaHarangajao};${destination}?overview=full&geometries=geojson`;
      const response = await fetch(osrmUrl);
      const data = await response.json();

      if (data?.routes?.[0]?.geometry?.coordinates) {
        const detourCoords = data.routes[0].geometry.coordinates;

        setVehicles(prev => prev.map(v => 
          v.id === 'TRK-402' 
            ? { 
                ...v, 
                status: 'REROUTED', 
                route: 'Shillong ➔ Umrongso Corridor ➔ Harangajao ➔ Silchar', 
                eta: '2h 55m (Shortest Hazard Bypass)',
                routeColor: [34, 197, 94],
                pathCoords: detourCoords,
                isRerouted: true,
                progress: 15
              }
            : v
        ));

        setSelectedVehicle(prev => ({
          ...prev,
          status: 'REROUTED',
          route: 'Shillong ➔ Umrongso Corridor ➔ Harangajao ➔ Silchar',
          eta: '2h 55m (Shortest Hazard Bypass)',
          routeColor: [34, 197, 94],
          pathCoords: detourCoords,
          isRerouted: true,
          progress: 15
        }));
      }
    } catch (err) {
      console.error('OSRM Bypass Route Calculation Failed:', err);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const toggle3DTerrain = () => {
    setEnable3D(!enable3D);
    setViewState(prev => ({
      ...prev,
      pitch: !enable3D ? 60 : 0,
      bearing: !enable3D ? -20 : 0,
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator()
    }));
  };

  const getMapLabelsData = () => {
    if (!selectedVehicle) return [];
    return [
      {
        text: `ORIGIN: ${selectedVehicle.originName.toUpperCase()}`,
        position: selectedVehicle.originCoords,
        color: [34, 197, 94],
        size: 12
      },
      {
        text: `DESTINATION: ${selectedVehicle.destName.toUpperCase()}`,
        position: selectedVehicle.destCoords,
        color: [244, 63, 94],
        size: 12
      }
    ];
  };

  // Render SVG Elevation Chart
  const renderElevationChart = () => {
    if (!activeElevationProfile || activeElevationProfile.length < 2) return null;

    const width = 520;
    const height = 95;
    const padding = { top: 12, right: 20, bottom: 22, left: 35 };

    const maxKm = activeElevationProfile[activeElevationProfile.length - 1].distKm || 1;
    const elevations = activeElevationProfile.map(p => p.elevationM);
    const minAlt = Math.max(0, Math.min(...elevations) - 50);
    const maxAlt = Math.max(...elevations) + 80;

    const scaleX = (km) => padding.left + (km / maxKm) * (width - padding.left - padding.right);
    const scaleY = (alt) => height - padding.bottom - ((alt - minAlt) / (maxAlt - minAlt)) * (height - padding.top - padding.bottom);

    const pointsStr = activeElevationProfile
      .map(p => `${scaleX(p.distKm)},${scaleY(p.elevationM)}`)
      .join(' L ');

    const areaPathStr = `M ${scaleX(0)},${height - padding.bottom} L ${pointsStr} L ${scaleX(maxKm)},${height - padding.bottom} Z`;
    const linePathStr = `M ${pointsStr}`;

    const currentTruckKm = (selectedVehicle.progress / 100) * maxKm;
    const currentTruckPoint = activeElevationProfile.reduce((prev, curr) => 
      Math.abs(curr.distKm - currentTruckKm) < Math.abs(prev.distKm - currentTruckKm) ? curr : prev
    , activeElevationProfile[0]);

    const truckX = scaleX(currentTruckPoint.distKm);
    const truckY = scaleY(currentTruckPoint.elevationM);

    return (
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 cursor-crosshair">
          <defs>
            <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((ratio, idx) => {
            const altVal = Math.round(minAlt + ratio * (maxAlt - minAlt));
            const y = scaleY(altVal);
            return (
              <g key={idx}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                <text x={padding.left - 6} y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                  {altVal}m
                </text>
              </g>
            );
          })}

          <path d={areaPathStr} fill="url(#elevationGrad)" />
          <path d={linePathStr} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {activeElevationProfile.map((p, idx) => {
            if (Math.abs(p.slopePct) > 8) {
              const x = scaleX(p.distKm);
              const y = scaleY(p.elevationM);
              return <circle key={idx} cx={x} cy={y} r="2" fill="#ef4444" />;
            }
            return null;
          })}

          <line x1={truckX} y1={padding.top} x2={truckX} y2={height - padding.bottom} stroke="#38bdf8" strokeDasharray="2 2" strokeWidth="1" />
          <circle cx={truckX} cy={truckY} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" className="animate-pulse" />

          {hoveredElevationPoint && (
            <g>
              <line x1={scaleX(hoveredElevationPoint.distKm)} y1={padding.top} x2={scaleX(hoveredElevationPoint.distKm)} y2={height - padding.bottom} stroke="#f59e0b" strokeWidth="1" />
              <circle cx={scaleX(hoveredElevationPoint.distKm)} cy={scaleY(hoveredElevationPoint.elevationM)} r="3.5" fill="#f59e0b" />
            </g>
          )}

          {activeElevationProfile.map((p, idx) => (
            <rect
              key={idx}
              x={scaleX(p.distKm) - 4}
              y={padding.top}
              width={8}
              height={height - padding.top - padding.bottom}
              fill="transparent"
              onMouseEnter={() => setHoveredElevationPoint(p)}
              onMouseLeave={() => setHoveredElevationPoint(null)}
            />
          ))}

          <text x={width / 2} y={height - 4} fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="sans-serif">
            Route Terrain Elevation ({maxKm.toFixed(1)} km)
          </text>
        </svg>

        {hoveredElevationPoint && (
          <div className="absolute top-1 right-2 bg-slate-900/90 border border-amber-500/50 px-2 py-0.5 rounded text-[10px] font-mono text-slate-200 flex items-center gap-2 shadow-lg">
            <span>Dist: <strong className="text-amber-400">{hoveredElevationPoint.distKm} km</strong></span>
            <span>Alt: <strong className="text-cyan-400">{hoveredElevationPoint.elevationM} m</strong></span>
            <span>Slope: <strong className={Math.abs(hoveredElevationPoint.slopePct) > 8 ? 'text-red-400 font-bold' : 'text-emerald-400'}>{hoveredElevationPoint.slopePct}%</strong></span>
          </div>
        )}
      </div>
    );
  };

  // Construct DeckGL Layers
  const layers = useMemo(() => [
    showRadar && radarTimestamp
      ? new TileLayer({
          id: 'rainviewer-radar-layer',
          data: `https://tilecache.rainviewer.com/v2/radar/${radarTimestamp}/256/{z}/{x}/{y}/2/1_1.png`,
          minZoom: 0,
          maxZoom: 12,
          tileSize: 256,
          opacity: 0.5,
          renderSubLayers: props => {
            const { bbox: { left, bottom, right, top } } = props.tile;
            return new BitmapLayer(props, {
              data: null,
              image: props.data,
              bounds: [left, bottom, right, top]
            });
          }
        })
      : null,

    showTemperature
      ? new TileLayer({
          id: 'openweathermap-temp-layer',
          data: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=b1b15e88fa797225412429c1c50c122a',
          minZoom: 0,
          maxZoom: 12,
          tileSize: 256,
          opacity: 0.45,
          renderSubLayers: props => {
            const { bbox: { left, bottom, right, top } } = props.tile;
            return new BitmapLayer(props, {
              data: null,
              image: props.data,
              bounds: [left, bottom, right, top]
            });
          }
        })
      : null,

    showTemperature
      ? new ScatterplotLayer({
          id: 'weather-station-pins',
          data: WEATHER_STATIONS,
          getPosition: d => d.coords,
          getRadius: 1800,
          getFillColor: d => d.temp > 28 ? [239, 68, 68, 200] : d.temp > 22 ? [245, 158, 11, 200] : [56, 189, 248, 200],
          getLineColor: [255, 255, 255, 255],
          getLineWidth: 2,
          stroked: true,
          pickable: true,
          radiusMinPixels: 6,
          radiusMaxPixels: 14
        })
      : null,

    showTemperature
      ? new TextLayer({
          id: 'weather-station-labels',
          data: WEATHER_STATIONS,
          getPosition: d => d.coords,
          getText: d => `${d.name}: ${d.temp}°C`,
          getSize: 11,
          getColor: [255, 255, 255],
          getBackgroundColor: [15, 23, 42, 220],
          background: true,
          backgroundPadding: [6, 4],
          pixelOffset: [0, -18],
          fontFamily: 'Inter, sans-serif',
          fontWeight: 'bold'
        })
      : null,

    showWindVectors
      ? new PathLayer({
          id: 'wind-vector-lines',
          data: windVectorData,
          getPath: d => d.path,
          getColor: d => d.speed > 28 ? [245, 158, 11, 230] : [56, 189, 248, 200],
          getWidth: 3,
          widthMinPixels: 2.5,
          capRounded: true,
          jointRounded: true
        })
      : null,

    showWindVectors
      ? new ScatterplotLayer({
          id: 'wind-vector-heads',
          data: windVectorData,
          getPosition: d => d.end,
          getRadius: 1000,
          getFillColor: d => d.speed > 28 ? [245, 158, 11, 255] : [56, 189, 248, 255],
          radiusMinPixels: 3,
          radiusMaxPixels: 5
        })
      : null,

    showWindVectors
      ? new TextLayer({
          id: 'wind-vector-text',
          data: windVectorData,
          getPosition: d => d.start,
          getText: d => `💨 ${d.speed} km/h`,
          getSize: 10,
          getColor: [226, 232, 240],
          getBackgroundColor: [15, 23, 42, 190],
          background: true,
          backgroundPadding: [4, 2],
          pixelOffset: [0, 14],
          fontFamily: 'monospace'
        })
      : null,

    new GeoJsonLayer({
      id: 'pinn-hazard-zones',
      data: hazardZones,
      filled: true,
      getFillColor: [239, 68, 68, 180],
      getLineColor: [255, 255, 255, 255],
      getLineWidth: 2,
      lineWidthMinPixels: 2,
      pickable: true
    }),

    ...vehicles.map(v => {
      if (!v.pathCoords || v.pathCoords.length === 0) return null;
      const isSelected = selectedVehicle?.id === v.id;
      return new PathLayer({
        id: `truck-path-${v.id}`,
        data: [{ path: v.pathCoords }],
        getPath: d => d.path,
        getColor: isSelected ? v.routeColor : [...v.routeColor.slice(0, 3), 120],
        getWidth: isSelected ? 6 : 3,
        widthMinPixels: isSelected ? 4 : 2,
        jointRounded: true,
        capRounded: true
      });
    }).filter(Boolean),

    new TextLayer({
      id: 'origin-dest-text-labels',
      data: getMapLabelsData(),
      getPosition: d => d.position,
      getText: d => d.text,
      getSize: d => d.size,
      getColor: d => d.color,
      getBackgroundColor: [15, 23, 42, 230],
      background: true,
      backgroundPadding: [8, 5],
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 'bold',
      pixelOffset: [0, -25]
    }),

    new IconLayer({
      id: 'fleet-layer',
      data: vehicles,
      getPosition: d => d.coordinates,
      getIcon: () => ({
        url: 'https://img.icons8.com/m_sharp/200/FFFFFF/truck.png',
        width: 128,
        height: 128,
        anchorY: 128
      }),
      getSize: d => (selectedVehicle?.id === d.id ? 46 : 34),
      getColor: d => d.status === 'WARNING' ? [239, 68, 68] : d.status === 'REROUTED' ? [34, 197, 94] : [6, 182, 212],
      pickable: true,
      onClick: info => info.object && handleSelectVehicle(info.object)
    })
  ].filter(Boolean), [vehicles, selectedVehicle, showRadar, radarTimestamp, showTemperature, showWindVectors, windVectorData, hazardZones]);

  return (
    <div className={`relative h-full w-full overflow-hidden bg-slate-950 font-sans text-slate-100 transition-all duration-500 ${
      emergencyMode ? 'shadow-[inset_0_0_80px_rgba(244,63,94,0.25)] border-2 border-rose-500/40' : ''
    }`}>

      {/* ========================================================= */}
      {/* 1. MAP CANVAS DECK.GL LAYER CONTAINER                      */}
      {/* ========================================================= */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
        getCursor={({ isHovering }) => (isHovering ? 'pointer' : 'default')}
      >
        <Map
          reuseMaps
          mapStyle={MAP_STYLE}
          preventStyleDiffing={true}
        />
      </DeckGL>

      {/* Ambient Emergency Grid Pulse */}
      {emergencyMode && (
        <div className="absolute inset-0 bg-rose-950/10 pointer-events-none animate-pulse z-0" />
      )}

      {/* ========================================================= */}
      {/* 2. FLOATING MAP OVERLAY CONTROLLER (TOP LEFT GLASS WIDGET) */}
      {/* ========================================================= */}
      <div className="absolute top-4 left-4 z-10 w-64 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Weather Overlays
            </span>
          </div>
          {loadingWeather ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />
          ) : (
            <button onClick={() => setShowWeatherMenu(!showWeatherMenu)} className="text-slate-400 hover:text-slate-200">
              {showWeatherMenu ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>

        {showWeatherMenu && (
          <div className="mt-3 space-y-2">
            <button
              onClick={() => setShowRadar(!showRadar)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                showRadar ? 'border-sky-500/50 bg-sky-500/10 text-sky-300' : 'border-slate-800 bg-slate-900/50 text-slate-400'
              }`}
            >
              <span className="flex items-center gap-2">
                <CloudRain className={`h-3.5 w-3.5 ${showRadar ? 'text-sky-400' : 'text-slate-500'}`} /> Doppler Radar
              </span>
              {showRadar ? <Eye className="h-3.5 w-3.5 text-sky-400" /> : <EyeOff className="h-3.5 w-3.5 text-slate-500" />}
            </button>

            <button
              onClick={() => setShowTemperature(!showTemperature)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                showTemperature ? 'border-amber-500/50 bg-amber-500/10 text-amber-300' : 'border-slate-800 bg-slate-900/50 text-slate-400'
              }`}
            >
              <span className="flex items-center gap-2">
                <Thermometer className={`h-3.5 w-3.5 ${showTemperature ? 'text-amber-400' : 'text-slate-500'}`} /> Thermal Heatmap
              </span>
              {showTemperature ? <Eye className="h-3.5 w-3.5 text-amber-400" /> : <EyeOff className="h-3.5 w-3.5 text-slate-500" />}
            </button>

            <button
              onClick={() => setShowWindVectors(!showWindVectors)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                showWindVectors ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' : 'border-slate-800 bg-slate-900/50 text-slate-400'
              }`}
            >
              <span className="flex items-center gap-2">
                <Wind className={`h-3.5 w-3.5 ${showWindVectors ? 'text-cyan-400' : 'text-slate-500'}`} /> Wind Field Vectors
              </span>
              {showWindVectors ? <Eye className="h-3.5 w-3.5 text-cyan-400" /> : <EyeOff className="h-3.5 w-3.5 text-slate-500" />}
            </button>

            <div className="mt-3 rounded-lg border border-slate-800/80 bg-slate-900/40 p-2 text-[10px] font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>ACTIVE FLEETS:</span>
                <span className="text-cyan-400 font-bold">1,420</span>
              </div>
              <div className="flex justify-between">
                <span>HAZARD CHOKE POINTS:</span>
                <span className="text-rose-400 font-bold">1 Active Block</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. FLOATING MAP CONTROLS (TOP RIGHT)                      */}
      {/* ========================================================= */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs font-bold backdrop-blur-md transition-all active:scale-95 ${
            isSimulating
              ? 'border-emerald-500/40 bg-emerald-950/80 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : 'border-slate-800 bg-slate-950/80 text-slate-400'
          }`}
        >
          {isSimulating ? <Pause className="h-3.5 w-3.5 text-emerald-400" /> : <Play className="h-3.5 w-3.5 text-slate-400" />}
          <span>{isSimulating ? 'Simulating GPS' : 'Pause GPS'}</span>
        </button>

        <button
          onClick={toggle3DTerrain}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs font-bold backdrop-blur-md transition-all active:scale-95 ${
            enable3D
              ? 'border-cyan-500/40 bg-cyan-950/80 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
              : 'border-slate-800 bg-slate-950/80 text-slate-400 hover:bg-slate-900'
          }`}
        >
          <Box className="h-3.5 w-3.5" />
          <span>{enable3D ? '3D View' : '2D Flat'}</span>
        </button>
      </div>

      {/* Emergency Mode Banner Tag (Center-Top) */}
      {emergencyMode && (
        <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 flex items-center gap-2 rounded-full border border-rose-500/60 bg-rose-950/90 px-4 py-1.5 font-mono text-xs font-extrabold text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.4)] backdrop-blur-md animate-bounce">
          <AlertTriangle className="h-4 w-4 text-rose-400 animate-pulse" />
          <span>EMERGENCY DISPATCH PROTOCOL ACTIVE</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SELECTED VEHICLE TELEMETRY & ELEVATION DRAWER (BOTTOM)  */}
      {/* ========================================================= */}
      {selectedVehicle && (
        <div className="absolute bottom-8 right-4 z-10 w-[540px] rounded-xl border border-slate-800/80 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl transition-all">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">{selectedVehicle.id} - {selectedVehicle.route}</span>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                selectedVehicle.status === 'WARNING' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                selectedVehicle.status === 'REROUTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              }`}>
                {selectedVehicle.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {selectedVehicle.status === 'WARNING' && (
                <button
                  onClick={handleSimulateReroute}
                  disabled={isCalculatingRoute}
                  className="flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white transition active:scale-95 disabled:opacity-50"
                >
                  {isCalculatingRoute ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  <span>Reroute via OSRM</span>
                </button>
              )}
              <button 
                onClick={() => setShowElevationDrawer(!showElevationDrawer)}
                className="text-slate-400 hover:text-slate-200"
              >
                {showElevationDrawer ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3 font-mono text-[11px]">
            <div className="rounded-lg bg-slate-900/60 p-2 border border-slate-800/60">
              <span className="text-slate-500 block text-[9px]">SPEED</span>
              <span className="text-slate-200 font-bold">{selectedVehicle.speed}</span>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2 border border-slate-800/60">
              <span className="text-slate-500 block text-[9px]">CARGO TEMP</span>
              <span className="text-cyan-400 font-bold">{selectedVehicle.temp}°C</span>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2 border border-slate-800/60">
              <span className="text-slate-500 block text-[9px]">FUEL LEVEL</span>
              <span className="text-amber-400 font-bold">{selectedVehicle.fuel}%</span>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2 border border-slate-800/60">
              <span className="text-slate-500 block text-[9px]">EST. ETA</span>
              <span className="text-emerald-400 font-bold">{selectedVehicle.eta}</span>
            </div>
          </div>

          {showElevationDrawer && renderElevationChart()}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. BOTTOM TACTICAL EVENT TELEMETRY TICKER                  */}
      {/* ========================================================= */}
      <div className="absolute bottom-0 inset-x-0 z-10 flex h-7 items-center border-t border-slate-800/80 bg-slate-950/90 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2 font-mono text-[10px] text-cyan-400 font-bold shrink-0 pr-3 border-r border-slate-800">
          <Radio className="h-3 w-3 animate-pulse" />
          <span>LIVE TELEMETRY</span>
        </div>
        
        <div className="flex-1 overflow-hidden ml-3 font-mono text-[10px] text-slate-400">
          <span>[12:22:10] [GPS ENGINE] Polyline route animation @ 60 FPS | Landslide risk high at NH-6.</span>
        </div>
      </div>

    </div>
  );
}