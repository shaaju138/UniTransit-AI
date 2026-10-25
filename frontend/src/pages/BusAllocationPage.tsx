import React, { useState } from 'react';
import { RouteItem, Vehicle } from '../types';
import { 
  ArrowRightLeft, 
  Bus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  MapPin,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';

interface BusAllocationPageProps {
  routes: RouteItem[];
  vehicles: Vehicle[];
  onApplyRecommendation: (recId: string) => Promise<any>;
  onNavigateTab: (tab: any) => void;
}

export const BusAllocationPage: React.FC<BusAllocationPageProps> = ({
  routes,
  vehicles,
  onApplyRecommendation,
  onNavigateTab
}) => {
  const route1 = routes.find(r => r.id === 'route-1') || routes[0];
  const isResolved = route1.riskLevel === 'SAFE' && route1.capacity > 50;

  const [allocating, setAllocating] = useState(false);

  const handleAllocate = async () => {
    setAllocating(true);
    await onApplyRecommendation('rec-r1-deploy');
    setAllocating(false);
  };

  // NRIIT Overview metrics
  const totalFleet = 12;
  const activeBuses = 8;
  const availableBuses = 4;
  const studentsTravelling = 1080;
  const routesAtRisk = routes.filter(r => r.riskLevel === 'HIGH').length;

  // Nearby and available support buses from TransitIQ fleet (configured database IDs)
  const supportBuses = [
    {
      busId: "veh-demo-d",
      name: "Bus 34 (Standby Shuttle)",
      currentRoute: "Central Transit Depot (Standby)",
      totalSeats: 35,
      currentOccupancy: 0,
      availableSeats: 35,
      proximity: "5.2 km / 8 mins to Chinna Kakani (Simulated GPS Proximity)",
      status: isResolved ? "Dispatched & In Transit" : "Available in Depot",
      recommendationNote: "Primary Support: Ready for immediate dispatch to absorb the 35-student queue at Chinna Kakani.",
      isPrimary: true
    },
    {
      busId: "veh-demo-c",
      name: "Bus 33",
      currentRoute: "Route 3 (Gannavaram Corridor)",
      totalSeats: 45,
      currentOccupancy: 19,
      availableSeats: 26,
      proximity: "9.8 km / 14 mins to Tenali Bypass (Simulated Proximity)",
      status: "Active on Low-Demand Corridor",
      recommendationNote: "Secondary Reallocation: Route 3 currently operating at only 49% capacity; can absorb eastern passengers.",
      isPrimary: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">
              TransitIQ Bus Allocation
            </h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              TransitIQ Fleet Only
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            AI-powered bus demand prediction and intelligent capacity management for TransitIQ Network.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xs text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-600">Allocation Engine:</span>
          <span className="font-bold text-slate-900">Automated</span>
        </div>
      </div>

      {/* 1. TransitIQ Transport Overview KPI Strip (6 Metrics) - 1 col on mobile, 2/3 on tablet, 6 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs min-w-0">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            1. TRANSIT OVERVIEW
          </span>
          <div className="mt-1 text-base font-bold text-slate-900 font-['Outfit'] truncate">
            Central Terminal
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block truncate">Vijayawada Hub</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs min-w-0">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            2. TOTAL FLEET
          </span>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {totalFleet}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block truncate">Campus Inventory</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs min-w-0">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            3. ACTIVE BUSES
          </span>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-600">
            {activeBuses}
          </div>
          <span className="text-[10px] text-emerald-700 mt-0.5 block font-semibold truncate">En Route to NRIIT</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs min-w-0">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            4. AVAILABLE BUSES
          </span>
          <div className="mt-1 text-2xl font-bold font-mono text-blue-600">
            {availableBuses}
          </div>
          <span className="text-[10px] text-blue-700 mt-0.5 block font-semibold truncate">Standby / Relocatable</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs min-w-0">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            5. TRAVELLING
          </span>
          <div className="mt-1 text-2xl font-bold font-mono text-indigo-600">
            {studentsTravelling}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block truncate">Morning Commuters</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs min-w-0">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            6. ROUTES AT RISK
          </span>
          <div className="mt-1 text-2xl font-bold font-mono text-red-600">
            {routesAtRisk}
          </div>
          <span className="text-[10px] text-red-700 mt-0.5 block font-bold truncate">
            {routesAtRisk > 0 ? 'Route 1 (Mangalagiri)' : 'All Corridors Safe'}
          </span>
        </div>
      </div>

      {/* 2. AI Bus Allocation Panel */}
      <div className={`rounded-2xl border-2 p-4 sm:p-6 shadow-sm transition-all min-w-0 ${
        isResolved
          ? 'bg-emerald-50/40 border-emerald-300'
          : 'bg-white border-red-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              isResolved ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {isResolved ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6 animate-pulse" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded shrink-0 ${
                  isResolved
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {isResolved ? 'OVERCROWDING RESOLVED' : 'HIGH DEMAND DETECTED'}
                </span>
                <span className="text-xs font-mono text-slate-400 break-anywhere">
                  Target: Route 1 (Mangalagiri to NRIIT)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] mt-0.5">
                AI Bus Allocation & Overflow Mitigation
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs self-start sm:self-auto shrink-0">
            <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
              Demand: <strong className="text-slate-900">58 pax</strong>
            </span>
            <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
              Capacity: <strong className="text-slate-900">{route1.capacity}</strong>
            </span>
            <span className={`px-2.5 py-1 rounded-lg font-bold ${
              isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}>
              {isResolved ? 'Headroom: 27' : 'Overflow: 8'}
            </span>
          </div>
        </div>

        {/* AI Action Box */}
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              AI ACTION:
            </span>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed break-anywhere">
              “Predicted demand exceeds the assigned bus capacity by 8 passengers. An available nearby NRIIT bus should be assigned to support this route.”
            </p>
          </div>

          {!isResolved && (
            <button
              onClick={handleAllocate}
              disabled={allocating}
              id="btn-allocate-support-bus"
              className="w-full md:w-auto min-h-[44px] bg-gradient-to-r from-red-600 to-indigo-700 hover:from-red-700 hover:to-indigo-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2 shrink-0"
            >
              <Bus className="w-4 h-4" />
              <span>{allocating ? 'Allocating Support Bus...' : 'Allocate Support Bus Now'}</span>
            </button>
          )}
          {isResolved && (
            <div className="w-full md:w-auto min-h-[44px] flex items-center justify-center gap-1.5 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-300 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Support Bus Deployed (Risk: SAFE 68%)</span>
            </div>
          )}
        </div>

        {/* Current Assigned Bus vs Recommended Support Bus (Side-by-Side on Desktop, Stacked Vertically on Mobile) */}
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Corridor Allocation: Current Bus & AI Recommendation Comparison
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Current Bus Card */}
            <div className="bg-white border-2 border-red-200 rounded-xl p-4 space-y-3 min-w-0">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-extrabold text-slate-700 tracking-wider">
                  CURRENT ASSIGNED BUS
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                  {route1.riskLevel} RISK
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">BUS ID</span>
                  <span className="font-bold text-slate-900">{route1.assignedVehicleId || 'veh-demo-a'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">CAPACITY</span>
                  <span className="font-bold text-slate-900">{route1.capacity} Seats</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">CURRENT</span>
                  <span className="font-bold text-slate-900">{route1.currentPassengers} / {route1.capacity}</span>
                </div>
                <div>
                  <span className="text-[10px] text-red-600 font-semibold block">PREDICTED OCCUPANCY</span>
                  <span className="font-bold text-red-600">{route1.predictedOccupancy}%</span>
                </div>
              </div>
            </div>

            {/* Recommended Support Bus Card */}
            <div className="bg-white border-2 border-emerald-200 rounded-xl p-4 space-y-3 min-w-0">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-extrabold text-emerald-800 tracking-wider">
                  AI RECOMMENDATION
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  AVAILABLE SUPPORT BUS
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">RECOMMENDED BUS</span>
                  <span className="font-bold text-slate-900">Standby Bus D</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">SUPPORT CAPACITY</span>
                  <span className="font-bold text-emerald-700">35 Seats Available</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">DEPOT PROXIMITY</span>
                  <span className="font-bold text-slate-900">5.2 km (8 mins)</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 font-semibold block">RELIEVED OCCUPANCY</span>
                  <span className="font-bold text-emerald-700">68% Balanced</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nearby / Available NRIIT Buses Table */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nearby & Available NRIIT Buses (Database Inventory)
            </h3>
            <span className="text-[11px] text-slate-400 italic">
              Proximity estimated via simulated GPS telemetry
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto touch-scroll">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Bus ID</th>
                    <th className="py-2.5 px-4">Vehicle Description</th>
                    <th className="py-2.5 px-4">Current Route / Status</th>
                    <th className="py-2.5 px-4">Capacity</th>
                    <th className="py-2.5 px-4">Available Seats</th>
                    <th className="py-2.5 px-4">Distance / Proximity</th>
                    <th className="py-2.5 px-4">AI Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {supportBuses.map((bus) => (
                    <tr 
                      key={bus.busId}
                      className={`hover:bg-slate-50 transition ${
                        bus.isPrimary ? 'bg-blue-50/30 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {bus.busId}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {bus.name}
                        {bus.isPrimary && (
                          <span className="ml-2 text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold">
                            RECOMMENDED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {bus.currentRoute}
                      </td>
                      <td className="py-3 px-4 font-mono">{bus.totalSeats} seats</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {bus.availableSeats} seats
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                        {bus.proximity}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-700">
                        {bus.recommendationNote}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* "Why this recommendation?" Section (from Prompt) */}
        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Info className="w-4 h-4 text-blue-600" />
            <span>Why this recommendation?</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-700">
            <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
              <p>
                <strong>Attendance increased:</strong> Morning classroom attendance in CSE & ECE registered at 94%, significantly raising outbound student transit volume.
              </p>
            </div>

            <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
              <p>
                <strong>Historical demand is high:</strong> Tuesday 08:30–09:00 AM period historically exhibits the heaviest Period 1 commuter arrival velocity.
              </p>
            </div>

            <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
              <p>
                <strong>Current bus occupancy is high:</strong> Assigned Vehicle A already carries 43 passengers (86% capacity) with only 7 vacant seats.
              </p>
            </div>

            <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
              <p>
                <strong>Upcoming stop demand is high:</strong> Combined waiting queue of 63 students is queued at Kaza (28) and Chinna Kakani (35).
              </p>
            </div>

            <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200 md:col-span-2">
              <span className="w-2 h-2 rounded-full bg-red-600 mt-1.5 shrink-0"></span>
              <p>
                <strong>Available capacity is insufficient:</strong> Overflow of 8 students will leave commuters stranded unless Standby Vehicle D is dispatched from the campus depot.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
