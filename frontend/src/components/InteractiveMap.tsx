import React, { useState, useEffect, useMemo } from 'react';
import { RouteItem } from '../types';
import { useLiveTracking } from '../services/trackingService';
import { 
  Bus, 
  Navigation, 
  MapPin, 
  Compass, 
  Clock, 
  Radio, 
  AlertTriangle,
  Info,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface InteractiveMapProps {
  route: RouteItem;
  allRoutes?: RouteItem[];
  onSelectRoute?: (r: RouteItem) => void;
  hideStopCounters?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  route,
  allRoutes = [],
  onSelectRoute,
  hideStopCounters = false
}) => {
  const { bus31, otherBuses, disclaimer } = useLiveTracking();
  const [selectedStop, setSelectedStop] = useState<any>(null);
  const [lastLocalHeartbeat, setLastLocalHeartbeat] = useState(1);

  // Determine if the currently displayed route is Bus 31 (Route 1)
  const isBus31Route = route.routeNumber === 1 || route.id === 'route-1' || route.assignedVehicle === 'Bus 31';

  // Heartbeat counter for telemetry freshness indicator
  useEffect(() => {
    const timer = setInterval(() => {
      setLastLocalHeartbeat((prev) => (prev >= 4 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const stops = route.stops || [];

  // Configuration validation: if route or stop coordinates are missing, display error notice
  const hasValidStops = stops.length >= 2 && stops.every(s => s && s.name);

  // Compute road geometry waypoints
  const roadWaypoints = useMemo(() => {
    if (isBus31Route) {
      // Realistic road curvature along NH-16 highway curve (preventing straight lines through buildings)
      return [
        { x: 75, y: 75, name: 'Central Transit Terminal' },
        { x: 105, y: 84 },
        { x: 135, y: 94 },
        { x: 165, y: 105, name: 'Pedda Kakani' },
        { x: 210, y: 122 },
        { x: 255, y: 140, name: 'Numbur' },
        { x: 305, y: 155 },
        { x: 355, y: 170, name: 'Koppuravuru' },
        { x: 410, y: 188 },
        { x: 465, y: 205, name: 'Kaza' },
        { x: 515, y: 220 },
        { x: 565, y: 235, name: 'Chinna Kakani' },
        { x: 610, y: 252 },
        { x: 655, y: 270, name: 'Tenali Bypass' },
        { x: 698, y: 288 },
        { x: 735, y: 305, name: 'Mangalagiri' }
      ];
    } else if (route.routeNumber === 2 || route.id === 'route-2') {
      return [
        { x: 80, y: 80, name: 'Central Transit Terminal' },
        { x: 200, y: 115, name: 'Nunna Village' },
        { x: 330, y: 155, name: 'Kandrika' },
        { x: 460, y: 200, name: 'Gunadala' },
        { x: 590, y: 250, name: 'Ramavarappadu Ring' },
        { x: 720, y: 295, name: 'Benz Circle' }
      ];
    } else if (route.routeNumber === 3 || route.id === 'route-3') {
      return [
        { x: 80, y: 80, name: 'Central Transit Terminal' },
        { x: 195, y: 115, name: 'Nunna Road Cut' },
        { x: 325, y: 155, name: 'Enikepadu Junction' },
        { x: 455, y: 200, name: 'Prasadampadu' },
        { x: 585, y: 250, name: 'Kesarapalle' },
        { x: 720, y: 295, name: 'Gannavaram Hub' }
      ];
    }

    // Fallback for custom added routes
    return stops.map((s, idx) => {
      const frac = idx / Math.max(stops.length - 1, 1);
      return {
        x: 80 + frac * 640,
        y: 80 + Math.sin(frac * Math.PI) * 110 + frac * 90,
        name: s.name
      };
    });
  }, [isBus31Route, route.routeNumber, route.id, stops]);

  // SVG road path string
  const svgPathD = useMemo(() => {
    if (!roadWaypoints || roadWaypoints.length < 2) return '';
    return `M ${roadWaypoints.map(p => `${p.x},${p.y}`).join(' L ')}`;
  }, [roadWaypoints]);

  // Stop anchor points along the route
  const stopAnchorPoints = useMemo(() => {
    if (isBus31Route) {
      return [
        { x: 75, y: 75, name: 'Central Transit Terminal', id: 'r1-s1' },
        { x: 165, y: 105, name: 'Pedda Kakani', id: 'r1-s2' },
        { x: 255, y: 140, name: 'Numbur', id: 'r1-s3' },
        { x: 355, y: 170, name: 'Koppuravuru', id: 'r1-s4' },
        { x: 465, y: 205, name: 'Kaza', id: 'r1-s5' },
        { x: 565, y: 235, name: 'Chinna Kakani', id: 'r1-s6' },
        { x: 655, y: 270, name: 'Tenali Bypass', id: 'r1-s7' },
        { x: 735, y: 305, name: 'Mangalagiri', id: 'r1-s8' }
      ];
    }
    return roadWaypoints
      .filter((p): p is { x: number; y: number; name: string } => Boolean(p.name))
      .map((p, idx) => ({ ...p, id: `stop-${idx}` }));
  }, [isBus31Route, roadWaypoints]);

  // Resolve assigned bus details
  const assignedBusNumber = isBus31Route ? 'Bus 31' : `Bus ${30 + (route.routeNumber || 1)}`;

  // Find tracking state for current route
  const currentOtherBus = otherBuses.find(b => b.assignedRouteId === route.id || b.busNumber === assignedBusNumber);

  // Position coordinates: Bus 31 uses live server position; others use stationary location
  const busCoordinates = useMemo(() => {
    if (isBus31Route) {
      return bus31?.coordinates || { x: 465, y: 205 };
    }
    if (currentOtherBus) {
      return currentOtherBus.coordinates;
    }
    const lastStop = stopAnchorPoints[stopAnchorPoints.length - 1] || { x: 720, y: 295 };
    return { x: lastStop.x, y: lastStop.y };
  }, [isBus31Route, bus31, currentOtherBus, stopAnchorPoints]);

  const corridorLabel =
    route.routeNumber === 1
      ? 'NH-16 Corridor • Mangalagiri - Central Hub Expressway'
      : route.routeNumber === 2
      ? 'Urban Mobility Corridor • Benz Circle - Central Terminal'
      : route.routeNumber === 3
      ? 'Airport Corridor • Gannavaram - Central Terminal Highway'
      : `${route.name} Corridor`;

  return (
    <div className="bg-white rounded-3xl border border-sky-100 text-slate-800 overflow-hidden shadow-xl shadow-sky-500/5 flex flex-col w-full min-w-0 transition-all duration-300">
      {/* Top Telemetry Header Bar */}
      <div className="bg-gradient-to-r from-sky-50/90 via-white to-blue-50/80 px-4 sm:px-6 py-3.5 border-b border-sky-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-extrabold text-slate-900 font-['Outfit']">
                TransitIQ Live Map
              </span>

              {/* Truthful Tracking Badge */}
              {isBus31Route ? (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  SIMULATED LIVE TRACKING — Demo Mode
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Not currently tracked (Demo Mode Active for Bus 31 Only)
                </span>
              )}

              <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                isBus31Route 
                  ? 'bg-sky-100 text-sky-800 border-sky-300' 
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {assignedBusNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md mt-0.5">
              {route.name} • {corridorLabel}
            </p>
          </div>
        </div>

        {/* Route Selector Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {allRoutes.length > 0 && onSelectRoute && (
            <div className="flex items-center bg-sky-50 rounded-xl p-1 border border-sky-200">
              {allRoutes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onSelectRoute(r)}
                  className={`text-xs px-3 py-1.5 min-h-[36px] rounded-lg font-bold transition cursor-pointer ${
                    r.id === route.id
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-sky-900 hover:bg-white'
                  }`}
                >
                  Route {r.routeNumber}
                </button>
              ))}
            </div>
          )}

          {/* Bus 31 Movement Status Indicator */}
          {isBus31Route && (
            <div className="flex items-center gap-1.5 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200 text-xs">
              <span className={`w-2 h-2 rounded-full ${bus31.isMoving ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="text-[11px] font-bold text-slate-800">
                {bus31.isMoving ? 'Moving (24 km/h)' : `Dwell: ${bus31.dwellRemainingSeconds}s`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Interactive Canvas or Error Notice */}
      {!hasValidStops ? (
        <div className="h-[320px] sm:h-[380px] bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
          <p className="font-bold text-white text-sm">Route Configuration Error</p>
          <p className="text-xs text-slate-400 max-w-md mt-1">
            This transit route is missing required stop waypoint coordinates. Unable to render road corridor geometry.
          </p>
        </div>
      ) : (
        <div className="relative w-full h-[320px] sm:h-[380px] md:h-[430px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden select-none">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)`,
              backgroundSize: '28px 28px'
            }}
          ></div>

          {/* Geographic labels */}
          <div className="absolute top-3 left-4 text-[10px] text-slate-400 uppercase tracking-widest font-mono hidden sm:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>{corridorLabel}</span>
          </div>
          <div className="absolute bottom-3 right-4 text-[10px] text-slate-400 uppercase tracking-wider font-mono hidden sm:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Central Hub Geo-Fence (Vijayawada)</span>
          </div>

          <svg viewBox="0 0 800 360" className="w-full h-full">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Road base bed (thick highway line following curvature) */}
            <path
              d={svgPathD}
              fill="none"
              stroke="#0f172a"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={svgPathD}
              fill="none"
              stroke="#334155"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Road dashed center divider */}
            <path
              d={svgPathD}
              fill="none"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />
            {/* Route highlight track */}
            <path
              d={svgPathD}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              strokeDasharray={isBus31Route ? "8 4" : "none"}
            />

            {/* Waypoint Stop Markers */}
            {stopAnchorPoints.map((stop, i) => {
              const isOrigin = i === 0;
              const isDestination = i === stopAnchorPoints.length - 1;
              const isCurrentStop = isBus31Route && bus31?.currentStopName === stop.name;

              return (
                <g
                  key={stop.id || i}
                  className="cursor-pointer group"
                  onClick={() => setSelectedStop(stop)}
                >
                  {/* Subtle pulse ring for active dwell stop */}
                  {isCurrentStop && !bus31.isMoving && (
                    <circle
                      cx={stop.x}
                      cy={stop.y}
                      r="16"
                      fill="rgba(245, 158, 11, 0.25)"
                      className="animate-ping"
                    />
                  )}

                  {/* Stop Marker Circle */}
                  <circle
                    cx={stop.x}
                    cy={stop.y}
                    r={isCurrentStop ? 9 : isOrigin || isDestination ? 8 : 6}
                    fill={
                      isCurrentStop 
                        ? '#f59e0b' 
                        : isOrigin 
                        ? '#10b981' 
                        : isDestination 
                        ? '#3b82f6' 
                        : '#94a3b8'
                    }
                    stroke="#020617"
                    strokeWidth="2.5"
                    className="transition group-hover:scale-125"
                  />

                  {/* Stop Name Label */}
                  <text
                    x={stop.x}
                    y={i % 2 === 0 ? stop.y - 14 : stop.y + 22}
                    textAnchor="middle"
                    fill="#f1f5f9"
                    fontSize="10.5"
                    fontWeight="600"
                    className="drop-shadow group-hover:fill-amber-300 pointer-events-none select-none"
                  >
                    {stop.name}
                  </text>
                </g>
              );
            })}

            {/* Bus Marker: Animated for Bus 31 ONLY; Stationary for other buses */}
            <g
              transform={`translate(${busCoordinates.x}, ${busCoordinates.y})`}
              className="cursor-pointer"
              style={{
                transition: isBus31Route ? 'transform 1.8s linear' : 'none'
              }}
            >
              {/* Radar beacon pulse: ONLY for Bus 31 when moving or dwelling */}
              {isBus31Route && (
                <circle
                  cx="0"
                  cy="0"
                  r="24"
                  fill={bus31.isMoving ? 'rgba(59, 130, 246, 0.25)' : 'rgba(245, 158, 11, 0.25)'}
                  className={bus31.isMoving ? 'animate-ping' : ''}
                />
              )}

              {/* Floating bus identity badge */}
              <g transform="translate(-38, -38)">
                <rect
                  x="0"
                  y="0"
                  width="76"
                  height="18"
                  rx="5"
                  fill="#020617"
                  stroke={isBus31Route ? '#38bdf8' : '#94a3b8'}
                  strokeWidth="1.5"
                />
                <text
                  x="38"
                  y="12.5"
                  textAnchor="middle"
                  fill={isBus31Route ? '#38bdf8' : '#cbd5e1'}
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="Outfit, sans-serif"
                >
                  {assignedBusNumber} {isBus31Route ? '• Live' : '• Static'}
                </text>
              </g>

              {/* Main vehicle marker icon housing */}
              <rect
                x="-16"
                y="-16"
                width="32"
                height="32"
                rx="8"
                fill={isBus31Route ? (bus31.isMoving ? '#2563eb' : '#d97706') : '#475569'}
                stroke="#ffffff"
                strokeWidth="2"
                filter="url(#glow)"
              />
              {/* Bus icon graphic */}
              <path
                d="M10 11c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v11c0 .55-.45 1-1 1h-1v2c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2h-6v2c0 .55-.45 1-1 1H8c-.55 0-1-.45-1-1v-2H6c-.55 0-1-.45-1-1V11zm2 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm12 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2-7H10v-3h16v3z"
                fill="#ffffff"
                transform="translate(-20, -21) scale(0.9)"
              />
            </g>
          </svg>

          {/* Live Overlay Telemetry HUD (Bottom Left) */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-sky-200 text-xs shadow-xl shadow-sky-950/10 max-w-[calc(100%-1.5rem)] sm:max-w-sm z-10 transition-all">
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-sky-100">
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5 truncate font-['Outfit']">
                <Bus className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="truncate">{assignedBusNumber}</span>
                <span className="text-slate-500 font-normal text-[11px]">
                  (Route {route.routeNumber})
                </span>
              </span>

              {isBus31Route ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1 border ${
                  bus31.isMoving 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${bus31.isMoving ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                  {bus31.isMoving ? 'In Transit' : `Stopped (${bus31.dwellRemainingSeconds}s)`}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 bg-slate-100 text-slate-600 border border-slate-200">
                  Not currently tracked
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
              <div>
                <span className="text-slate-500 text-[10px] block">CURRENT LOCATION / STATUS</span>
                <p className="text-slate-800 font-semibold truncate mt-0.5">
                  {isBus31Route ? bus31.statusDescription : (currentOtherBus?.currentLocation || 'Scheduled Station Standby')}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">NEXT WAYPOINT (ETA)</span>
                <p className="text-sky-700 font-semibold truncate mt-0.5">
                  {isBus31Route 
                    ? `${bus31.nextStopName} (${bus31.etaMinutes}m)` 
                    : (route.nextStop ? `${route.nextStop} (${route.etaMinutes}m)` : 'Station Standby')}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">OCCUPANCY / SPEED</span>
                <p className="font-mono font-bold text-slate-800 mt-0.5">
                  {isBus31Route ? `${bus31.speedKmph} km/h • ` : '0 km/h • '}
                  {route.currentPassengers} / {route.capacity}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">TELEMETRY HEARTBEAT</span>
                <p className="font-mono text-emerald-700 text-[10px] flex items-center gap-1 mt-0.5 font-bold">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{isBus31Route ? `${lastLocalHeartbeat}s ago (Live Engine)` : 'GPS Inactive'}</span>
                </p>
              </div>
            </div>

            {/* Explicit Demo Mode / Truthful Tracking Disclaimer */}
            <div className="mt-2.5 pt-2 border-t border-sky-100 flex items-start gap-1.5 text-[10px] text-slate-600">
              <Radio className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isBus31Route ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="leading-tight">
                {isBus31Route 
                  ? 'SIMULATED LIVE TRACKING — Demo Mode (Bus 31 only. Synthetic movement along configured route; 2–3 min stop dwell).'
                  : 'Not currently tracked. Physical vehicle tracker is inactive; live simulation is configured for Bus 31 only.'}
              </span>
            </div>
          </div>

          {/* Selected Stop Details Popover (Top Right) */}
          {selectedStop && (
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-sky-200 text-xs shadow-xl shadow-sky-950/10 max-w-[calc(100%-2rem)] sm:w-64 animate-in fade-in z-20">
              <div className="flex items-center justify-between pb-1.5 border-b border-sky-100">
                <span className="font-bold text-sky-800 flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-sky-600" />
                  <span className="truncate">{selectedStop.name}</span>
                </span>
                <button
                  onClick={() => setSelectedStop(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs px-1 cursor-pointer font-bold"
                  aria-label="Close Stop Popover"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Route Status:</span>
                  <span className="font-bold text-emerald-700">Scheduled Stop</span>
                </div>
                {isBus31Route && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bus 31 Proximity:</span>
                    <span className="font-bold text-sky-700 font-mono">
                      {bus31.currentStopName === selectedStop.name 
                        ? (bus31.isMoving ? 'Passing Waypoint' : `Stopped here (${bus31.dwellRemainingSeconds}s)`)
                        : bus31.nextStopName === selectedStop.name 
                        ? `Next stop (${bus31.etaMinutes}m)` 
                        : 'En route'}
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-slate-500 pt-1 border-t border-sky-100 italic">
                  Configured waypoint along {corridorLabel}.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Corridor Waypoint Strip */}
      <div className="bg-gradient-to-r from-sky-50/80 via-white to-blue-50/70 px-4 py-3 border-t border-sky-100 flex items-center justify-between text-xs overflow-x-auto touch-scroll gap-3">
        <div className="flex items-center gap-1.5 text-slate-600 shrink-0 font-medium">
          <Navigation className="w-3.5 h-3.5 text-sky-600" />
          <span>Waypoints:</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] shrink-0">
          {stops.map((s, idx) => {
            const isBusHere = isBus31Route && bus31.currentStopName === s.name && !bus31.isMoving;
            return (
              <React.Fragment key={s.id || idx}>
                <span
                  onClick={() => setSelectedStop(s)}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg transition font-medium border ${
                    isBusHere
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold shadow-xs'
                      : 'bg-white text-slate-700 hover:text-sky-900 hover:bg-sky-50 border-sky-200 shadow-2xs'
                  }`}
                >
                  {s.name}
                  {isBusHere && <span className="ml-1 text-[10px]">🚌</span>}
                </span>
                {idx < stops.length - 1 && <span className="text-sky-300 font-bold">→</span>}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
