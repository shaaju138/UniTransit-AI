import React, { useState } from 'react';
import { RouteItem } from '../types';
import { InteractiveMap } from '../components/InteractiveMap';
import { useLiveTracking } from '../services/trackingService';
import { 
  Bus, 
  MapPin, 
  Radio, 
  Gauge, 
  Users, 
  AlertTriangle, 
  Clock, 
  Phone, 
  CheckCircle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface LiveMonitoringProps {
  routes: RouteItem[];
}

export const LiveMonitoring: React.FC<LiveMonitoringProps> = ({ routes }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-1');
  const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
  const { bus31, otherBuses } = useLiveTracking();

  const isBus31 = activeRoute.routeNumber === 1 || activeRoute.id === 'route-1' || activeRoute.assignedVehicle === 'Bus 31';
  const assignedBusNumber = isBus31 ? 'Bus 31' : `Bus ${30 + (activeRoute.routeNumber || 1)}`;

  const displayLocation = isBus31 
    ? bus31.statusDescription 
    : 'Stationary / Not currently tracked (Demo Mode Active for Bus 31 Only)';

  const displayNextStop = isBus31 ? bus31.nextStopName : (activeRoute.nextStop || 'Station Standby');
  const displayEta = isBus31 ? bus31.etaMinutes : activeRoute.etaMinutes;
  const displaySpeed = isBus31 ? `${bus31.speedKmph} km/h` : '0 km/h (GPS Inactive)';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">
              Live Bus Monitoring & Telemetry
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              SIMULATED LIVE TRACKING — Demo Mode
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time simulated telemetry for TransitIQ fleet across regional transit routes.
          </p>
        </div>

        {/* Route Selector Pills */}
        <div className="flex items-center bg-sky-50/80 p-1 rounded-xl border border-sky-100 shadow-xs overflow-x-auto max-w-full touch-scroll">
          {routes.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRouteId(r.id)}
              className={`text-xs px-3.5 py-2 min-h-[44px] rounded-lg font-bold transition whitespace-nowrap flex items-center justify-center cursor-pointer ${
                r.id === activeRoute.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-sky-900 hover:bg-white'
              }`}
            >
              Route {r.routeNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Status Callout for Active Bus */}
      <div className={`p-4 rounded-2xl border ${
        activeRoute.riskLevel === 'HIGH'
          ? 'bg-red-50/70 border-red-300'
          : activeRoute.riskLevel === 'MODERATE'
          ? 'bg-amber-50/70 border-amber-300'
          : 'bg-emerald-50/70 border-emerald-300'
      } flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl shrink-0 ${
            activeRoute.riskLevel === 'HIGH' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
          }`}>
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{activeRoute.name}</span>
              <span className="text-xs bg-white text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200">
                {assignedBusNumber}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isBus31 
                  ? (bus31.isMoving ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300') 
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}>
                {isBus31 ? (bus31.isMoving ? 'Moving in Demo Mode' : `Stopped (${bus31.dwellRemainingSeconds}s)`) : 'Not currently tracked'}
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Status: <strong className="text-slate-900">{displayLocation}</strong></span>
              <span>•</span>
              <span>Next: <strong className="text-blue-700">{displayNextStop}</strong></span>
              <span>•</span>
              <span>ETA: <strong className="text-slate-900">{displayEta} mins</strong></span>
            </div>
          </div>
        </div>

        {/* Telemetry pill */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
          <div className="text-left sm:text-right">
            <span className="text-slate-500 text-[10px] block">CURRENT OCCUPANCY</span>
            <span className="font-bold text-slate-900 text-sm sm:text-base">
              {activeRoute.currentPassengers} / {activeRoute.capacity} ({Math.round((activeRoute.currentPassengers / activeRoute.capacity) * 100)}%)
            </span>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-slate-500 text-[10px] block">AI PREDICTED INFLUX</span>
            <span className={`font-bold text-sm sm:text-base ${activeRoute.riskLevel === 'HIGH' ? 'text-red-600' : 'text-slate-800'}`}>
              {activeRoute.predictedPassengers} ({activeRoute.predictedOccupancy}%)
            </span>
          </div>
          <div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-block ${
              activeRoute.riskLevel === 'HIGH' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {activeRoute.riskLevel} RISK
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <InteractiveMap
        route={activeRoute}
        allRoutes={routes}
        onSelectRoute={(r) => setSelectedRouteId(r.id)}
      />

      {/* Detailed Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-xs min-w-0 card-hover">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Gauge className="w-4 h-4 text-sky-600" />
            <span>Telemetry Velocity</span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900">{displaySpeed}</div>
          <p className="text-[11px] text-slate-500 mt-1">{isBus31 ? 'Corridor Transit Speed' : 'Stationary Vehicle'}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-xs min-w-0 card-hover">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Available Capacity</span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900">
            {Math.max(0, activeRoute.capacity - activeRoute.currentPassengers)} Seats Left
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Current Physical Headroom</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-xs min-w-0 card-hover">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Assigned Driver Contact</span>
          </div>
          <div className="mt-2 text-sm font-bold text-slate-900 truncate">Driver R. Narayana</div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">+91 98480 12345</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-xs min-w-0 card-hover">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>AI Risk Prediction</span>
          </div>
          <div className={`mt-2 text-xl font-bold font-mono ${activeRoute.riskLevel === 'HIGH' ? 'text-red-600' : 'text-emerald-600'}`}>
            {activeRoute.predictedOccupancy}% Influx
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {activeRoute.riskLevel === 'HIGH' ? 'Overcrowding threshold breached' : 'Nominal corridor headroom'}
          </p>
        </div>
      </div>

      {/* Stop Sequence Table */}
      <div className="bg-white rounded-2xl border border-sky-100 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
              {activeRoute.name} — Stop Demands & Boarding Pipeline
            </h3>
            <p className="text-xs text-slate-500">
              Corridor stop-by-stop passenger progression and waiting student concentrations.
            </p>
          </div>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-mono self-start sm:self-auto">
            {activeRoute.stops?.length || 0} Scheduled Stops
          </span>
        </div>

        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-4">Stop Name</th>
                <th className="py-2.5 px-4">Distance from Central Terminal</th>
                <th className="py-2.5 px-4">Waiting Students</th>
                <th className="py-2.5 px-4">Predicted Boarding</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {activeRoute.stops?.map((stop, idx) => (
                <tr 
                  key={stop.id || idx}
                  className={`hover:bg-slate-50/80 transition ${
                    stop.name === activeRoute.nextStop ? 'bg-blue-50/40 font-semibold' : ''
                  }`}
                >
                  <td className="py-2.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-4">
                    <span className="font-bold text-slate-900">{stop.name}</span>
                    {stop.name === activeRoute.nextStop && (
                      <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                        NEXT STOP
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-mono">{stop.km} km</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-amber-600">
                    {stop.demand} students
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">
                    +{Math.round(stop.demand * 0.75)} pax
                  </td>
                  <td className="py-2.5 px-4">
                    {stop.demand >= 25 ? (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                        Bottleneck
                      </span>
                    ) : stop.demand >= 15 ? (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">
                        Moderate
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
