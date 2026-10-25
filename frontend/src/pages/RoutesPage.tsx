import React, { useState, useEffect } from 'react';
import { RouteItem } from '../types';
import { InteractiveMap } from '../components/InteractiveMap';
import { useLiveTracking } from '../services/trackingService';
import { 
  Bus, 
  MapPin, 
  Plus, 
  Users, 
  ArrowLeft, 
  Radio, 
  Clock, 
  Info, 
  X, 
  ChevronRight, 
  Navigation,
  Compass,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface RoutesPageProps {
  routes: RouteItem[];
  onAddRoute: (newRoute: Partial<RouteItem>) => Promise<RouteItem>;
}

export const RoutesPage: React.FC<RoutesPageProps> = ({ routes, onAddRoute }) => {
  const { bus31 } = useLiveTracking();
  const [showAddModal, setShowAddModal] = useState(false);
  // Dedicated live bus tracking state
  const [trackingRoute, setTrackingRoute] = useState<RouteItem | null>(null);

  // Form state for adding custom routes
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('Central Transit Terminal');
  const [destination, setDestination] = useState('');
  const [capacity, setCapacity] = useState('50');
  const [stopsText, setStopsText] = useState('Central Terminal, Pedda Kakani, Numbur, Koppuravuru');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize trackingRoute if routes prop updates (e.g. from boarding or attendance changes)
  useEffect(() => {
    if (trackingRoute) {
      const refreshed = routes.find(r => r.id === trackingRoute.id);
      if (refreshed) {
        setTrackingRoute(refreshed);
      }
    }
  }, [routes]);

  // Clean vehicle label resolver ensuring Route 1 = Bus 31, Route 2 = Bus 32, Route 3 = Bus 33 with no demo tags
  const getAssignedBusNumber = (r: RouteItem): string => {
    if (r.routeNumber === 1 || r.id === 'route-1') return 'Bus 31';
    if (r.routeNumber === 2 || r.id === 'route-2') return 'Bus 32';
    if (r.routeNumber === 3 || r.id === 'route-3') return 'Bus 33';

    // Fallback cleanup
    if (r.assignedVehicle) {
      let cleaned = r.assignedVehicle
        .replace(/\(Assigned Vehicle [A-Z]\)/gi, '')
        .replace(/\(Demo Bus\)/gi, '')
        .replace(/\(Transit Fleet\)/gi, '')
        .replace(/Assigned Vehicle [A-Z]/gi, '')
        .trim();
      if (cleaned) return cleaned;
    }
    return `Bus ${30 + (r.routeNumber || 1)}`;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !destination) return;
    setIsSubmitting(true);

    const parsedStops = stopsText.split(',').map((s, idx) => ({
      id: `custom-s${idx + 1}`,
      name: s.trim(),
      km: idx * 4.5,
      demand: Math.floor(Math.random() * 18) + 5
    }));

    await onAddRoute({
      name,
      origin,
      destination,
      capacity: parseInt(capacity) || 50,
      stops: parsedStops
    });

    setName('');
    setDestination('');
    setIsSubmitting(false);
    setShowAddModal(false);
  };

  // ================= VIEW: DEDICATED LIVE BUS TRACKING =================
  if (trackingRoute) {
    const busNum = getAssignedBusNumber(trackingRoute);
    const occupancyPct = Math.round(
      ((trackingRoute.currentPassengers || 0) / (trackingRoute.capacity || 50)) * 100
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Tracking Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTrackingRoute(null)}
              id="btn-back-to-routes"
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Routes</span>
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-md font-mono">
                  Route {trackingRoute.routeNumber}
                </span>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 font-['Outfit']">
                  Live Tracking: {busNum}
                </h1>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border ${
                  busNum === 'Bus 31'
                    ? (bus31.isMoving ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300')
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${busNum === 'Bus 31' ? (bus31.isMoving ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500') : 'bg-slate-400'}`}></span>
                  {busNum === 'Bus 31' ? (bus31.isMoving ? 'Moving in Demo Mode' : `Stopped (${bus31.dwellRemainingSeconds}s)`) : 'Not currently tracked'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {trackingRoute.name} • {trackingRoute.origin} ⇄ {trackingRoute.destination}
              </p>
            </div>
          </div>

          {/* Quick Route Switcher in Tracking View */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto overflow-x-auto max-w-full">
            <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider font-mono hidden md:inline">
              Switch Bus:
            </span>
            {routes.map((r) => {
              const rBus = getAssignedBusNumber(r);
              const isActive = r.id === trackingRoute.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setTrackingRoute(r)}
                  className={`text-xs px-3 py-1.5 min-h-[36px] rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Bus className="w-3.5 h-3.5" />
                  <span>{rBus}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Telemetry KPI Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
              Assigned Vehicle
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                {trackingRoute.routeNumber}
              </div>
              <span className="text-base font-extrabold text-slate-900 font-['Outfit']">
                {busNum}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
              Current Location
            </span>
            <p className="text-sm font-bold text-slate-900 truncate mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{busNum === 'Bus 31' ? bus31.statusDescription : 'Stationary / Not currently tracked'}</span>
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
              Next Waypoint (ETA)
            </span>
            <p className="text-sm font-bold text-blue-700 truncate mt-1 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate">{busNum === 'Bus 31' ? `${bus31.nextStopName} (${bus31.etaMinutes}m)` : `${trackingRoute.nextStop} (${trackingRoute.etaMinutes}m)`}</span>
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
              Seating & Occupancy
            </span>
            <p className="text-sm font-mono font-bold text-slate-900 mt-1">
              {trackingRoute.currentPassengers} / {trackingRoute.capacity} ({occupancyPct}%)
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
              Operational Status
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-extrabold text-emerald-700 text-sm">
                {trackingRoute.status || 'In Transit'}
              </span>
            </div>
          </div>
        </div>

        {/* Embedded Interactive Tracking Map */}
        <InteractiveMap
          route={trackingRoute}
          allRoutes={routes}
          onSelectRoute={(r) => setTrackingRoute(r)}
          hideStopCounters={true}
        />

        {/* Clear Telemetry Mode Notice */}
        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-950">
          <Radio className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold flex items-center gap-2">
              <span>SIMULATED LIVE TRACKING — Demo Mode</span>
              {busNum === 'Bus 31' ? (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Active Simulation
                </span>
              ) : (
                <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Not currently tracked
                </span>
              )}
            </p>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              {busNum === 'Bus 31' 
                ? 'Live demo simulation is active exclusively for Bus 31. Telemetry advances along the configured road geometry with 2–3 minute stop dwells at each scheduled waypoint. No physical GPS hardware tracker is connected.' 
                : `${busNum} is scheduled on standby/transit and is not currently tracked with a moving marker. Demo live simulation is active for Bus 31 only.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ================= VIEW: CLEAN SIMPLIFIED ROUTE CARDS =================
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">
              TransitIQ Transit Corridors
            </h1>
            <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
              Active Corridors ({routes.length})
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Official transit corridors configured in TransitIQ Network. Track live bus locations and view real-time seating availability.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          id="btn-add-route"
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold shadow-xs transition shrink-0 self-start sm:self-auto cursor-pointer btn-hover"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Route</span>
        </button>
      </div>

      {/* Clean System Architecture Banner */}
      <div className="bg-white border border-sky-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-700 shadow-xs card-hover">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-[11px] sm:text-xs">
          <p className="font-bold text-slate-900">
            TransitIQ Fleet Assignments & Live Tracking
          </p>
          <p className="text-slate-500 mt-0.5">
            Click <strong>Track Live Bus</strong> on any route card below to launch an interactive live telemetry tracking view for that assigned bus.
          </p>
        </div>
      </div>

      {/* Simplified, Clean & Professional Route Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {routes.map((r) => {
          const busNum = getAssignedBusNumber(r);
          const occupancyPct = Math.round(((r.currentPassengers || 0) / (r.capacity || 50)) * 100);

          return (
            <div
              key={r.id}
              className="bg-white rounded-3xl border border-sky-100 hover:border-sky-300 card-hover p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs group"
            >
              {/* Card Header: Route Number & Status */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-sky-100/70">
                  <span className="text-xs font-extrabold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg font-mono">
                    Route {r.routeNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {r.status || 'In Transit'}
                    </span>
                  </div>
                </div>

                {/* Route Name & Terminals */}
                <h3 className="text-base font-extrabold text-slate-900 font-['Outfit'] mt-3 group-hover:text-sky-700 transition">
                  {r.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>{r.origin}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-medium text-slate-700 truncate">{r.destination}</span>
                </p>

                {/* Core Essential Route Metrics */}
                <div className="mt-4 space-y-2.5 pt-3 border-t border-sky-100/70 text-xs">
                  {/* Assigned Bus Number */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Assigned Bus:</span>
                    <span className="font-extrabold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md font-mono text-xs">
                      {busNum}
                    </span>
                  </div>

                  {/* Current Location */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Current Location:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[170px] text-right flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                      <span className="truncate">{r.currentLocation}</span>
                    </span>
                  </div>

                  {/* Passenger Count & Seating Capacity */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Passenger Load:</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {r.currentPassengers} / {r.capacity} seats
                    </span>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Occupancy:</span>
                      <span className={`font-bold ${
                        occupancyPct >= 100 ? 'text-red-600' : occupancyPct >= 75 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {occupancyPct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          occupancyPct >= 100
                            ? 'bg-red-500'
                            : occupancyPct >= 75
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prominent Track Live Bus Button */}
              <div className="pt-2">
                <button
                  type="button"
                  id={`btn-track-live-${r.id}`}
                  onClick={() => setTrackingRoute(r)}
                  className="w-full min-h-[44px] bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-2xl shadow-xs hover:shadow transition flex items-center justify-center gap-2 cursor-pointer group/btn btn-hover"
                >
                  <Radio className="w-4 h-4 text-sky-200 group-hover/btn:animate-pulse" />
                  <span>Track Live Bus</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-sky-200 transition group-hover/btn:translate-x-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Route Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                Add New Transit Corridor
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Route Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Route 4 — Poranki & Penamaluru Hub"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Origin Point</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-600 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Destination Point</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Poranki Center"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-600 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Vehicle Seating Capacity</label>
                <input
                  type="number"
                  min="20"
                  max="80"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-600 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Intermediate Stops (comma-separated)
                </label>
                <textarea
                  rows={3}
                  value={stopsText}
                  onChange={(e) => setStopsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-600 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 min-h-[44px] rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold flex items-center justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs flex items-center justify-center cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Add Route Corridor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
