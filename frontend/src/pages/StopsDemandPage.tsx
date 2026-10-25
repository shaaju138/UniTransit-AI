import React, { useState, useEffect } from 'react';
import { RouteItem } from '../types';
import { api } from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  CartesianGrid
} from 'recharts';
import { 
  MapPin, 
  Users, 
  AlertTriangle, 
  RefreshCw, 
  Filter, 
  Bus,
  CheckCircle2,
  TrendingUp,
  Info
} from 'lucide-react';

export interface StopDemandItem {
  id: string;
  name: string;
  routeId: string;
  routeName: string;
  routeNumber: number;
  busNumber: string;
  waitingStudents: number;
  demand: number;
  demandLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  km: number;
}

interface StopsDemandPageProps {
  routes?: RouteItem[];
  currentAttendance?: number;
}

export const StopsDemandPage: React.FC<StopsDemandPageProps> = ({ 
  routes = [],
  currentAttendance
}) => {
  const [stops, setStops] = useState<StopDemandItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('ALL');

  const fetchStops = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStops();
      if (Array.isArray(data) && data.length > 0) {
        setStops(data);
      } else {
        setStops([]);
      }
    } catch (err: any) {
      setError('Unable to load bus stop demand data. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStops();
  }, [routes, currentAttendance]);

  // Filter stops based on selected corridor
  const filteredStops = selectedRouteFilter === 'ALL'
    ? stops
    : stops.filter(s => s.routeId === selectedRouteFilter);

  // Compute metrics
  const totalWaiting = filteredStops.reduce((sum, s) => sum + s.waitingStudents, 0);
  const criticalCount = filteredStops.filter(s => s.demandLevel === 'Critical' || s.demandLevel === 'High').length;

  const getDemandBadgeClass = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200 font-extrabold';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200 font-bold';
      case 'Moderate':
        return 'bg-amber-100 text-amber-800 border-amber-200 font-semibold';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200 font-semibold';
    }
  };

  const getBarColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return '#dc2626'; // red-600
      case 'High':
        return '#ea580c'; // orange-600
      case 'Moderate':
        return '#d97706'; // amber-600
      default:
        return '#2563eb'; // blue-600
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">
              Bus Stops & Student Demand
            </h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              Live Network Queue
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time student boarding demand across all NRI Institute of Technology transit stops and corridors.
          </p>
        </div>

        <button
          onClick={fetchStops}
          className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs transition shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Demand</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Active Network Stops
            </span>
            <span className="text-xl font-extrabold font-['Outfit'] text-slate-900 mt-1 block">
              {filteredStops.length} Stops
            </span>
            <span className="text-[11px] text-slate-500">Across 3 transit corridors</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Total Waiting Students
            </span>
            <span className="text-xl font-extrabold font-['Outfit'] text-slate-900 mt-1 block">
              {totalWaiting} Students
            </span>
            <span className="text-[11px] text-slate-500">Queued for morning arrivals</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              High-Demand Bottlenecks
            </span>
            <span className="text-xl font-extrabold font-['Outfit'] text-red-600 mt-1 block">
              {criticalCount} Critical / High Stops
            </span>
            <span className="text-[11px] text-red-700 font-medium">Requires capacity monitoring</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Corridor Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto touch-scroll pb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mr-1">
          Corridor:
        </span>
        <button
          onClick={() => setSelectedRouteFilter('ALL')}
          className={`text-xs px-3.5 py-2 rounded-xl font-bold transition cursor-pointer whitespace-nowrap min-h-[38px] ${
            selectedRouteFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          All Stops ({stops.length})
        </button>
        <button
          onClick={() => setSelectedRouteFilter('route-1')}
          className={`text-xs px-3.5 py-2 rounded-xl font-bold transition cursor-pointer whitespace-nowrap min-h-[38px] ${
            selectedRouteFilter === 'route-1'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          Route 1 — Mangalagiri (Bus 31)
        </button>
        <button
          onClick={() => setSelectedRouteFilter('route-2')}
          className={`text-xs px-3.5 py-2 rounded-xl font-bold transition cursor-pointer whitespace-nowrap min-h-[38px] ${
            selectedRouteFilter === 'route-2'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          Route 2 — Benz Circle (Bus 32)
        </button>
        <button
          onClick={() => setSelectedRouteFilter('route-3')}
          className={`text-xs px-3.5 py-2 rounded-xl font-bold transition cursor-pointer whitespace-nowrap min-h-[38px] ${
            selectedRouteFilter === 'route-3'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          Route 3 — Gannavaram (Bus 33)
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStops}
            className="font-bold underline hover:text-red-950 ml-4 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold">Loading transit stops and student demand telemetry...</p>
        </div>
      ) : filteredStops.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <Info className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 font-['Outfit']">No Bus Stops Found</h3>
          <p className="text-xs text-slate-500">There are no stops registered under this corridor filter.</p>
        </div>
      ) : (
        <>
          {/* Waiting-Student Count Chart */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
                  Student Waiting Count by Transit Stop
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual distribution of students queued at stops across the NRIIT transit network
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span>
                  <span className="text-slate-600 text-[11px]">Critical (≥ 25)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-orange-600 inline-block"></span>
                  <span className="text-slate-600 text-[11px]">High (18–24)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-600 inline-block"></span>
                  <span className="text-slate-600 text-[11px]">Moderate (10–17)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                  <span className="text-slate-600 text-[11px]">Low (&lt; 10)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredStops} margin={{ top: 10, right: 10, left: -10, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: '#475569' }} 
                    angle={-25} 
                    textAnchor="end" 
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as StopDemandItem;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-800">
                            <p className="font-extrabold text-blue-400 font-['Outfit']">{data.name}</p>
                            <p className="text-[11px] text-slate-300 mt-0.5">{data.routeName}</p>
                            <p className="mt-2 font-mono">
                              Waiting Students: <strong className="text-amber-400 text-sm">{data.waitingStudents}</strong>
                            </p>
                            <p className="text-slate-300 text-[11px] font-mono">Assigned Bus: {data.busNumber}</p>
                            <div className="mt-1 pt-1 border-t border-slate-800">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                data.demandLevel === 'Critical' ? 'bg-red-950 text-red-300 border border-red-700' :
                                data.demandLevel === 'High' ? 'bg-orange-950 text-orange-300 border border-orange-700' :
                                data.demandLevel === 'Moderate' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                                'bg-blue-950 text-blue-300 border border-blue-700'
                              }`}>
                                {data.demandLevel} Demand
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="waitingStudents" radius={[6, 6, 0, 0]}>
                    {filteredStops.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getBarColor(entry.demandLevel)} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clean Stops & Demand Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-['Outfit']">
                  Stop-Level Demand Registry
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete listing of transit waypoints, assigned buses, and student boarding queues
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                Showing {filteredStops.length} stops
              </span>
            </div>

            <div className="overflow-x-auto touch-scroll">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Stop Name</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4">Bus Number</th>
                    <th className="py-3 px-4">Waiting Students</th>
                    <th className="py-3 px-4">Demand Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredStops.map((stop) => {
                    const isHighDemand = stop.demandLevel === 'Critical' || stop.demandLevel === 'High';
                    return (
                      <tr 
                        key={stop.id} 
                        className={`transition ${isHighDemand ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50'}`}
                      >
                        {/* Stop Name */}
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <MapPin className={`w-3.5 h-3.5 shrink-0 ${isHighDemand ? 'text-red-600' : 'text-blue-600'}`} />
                            <span className="font-semibold text-slate-900">{stop.name}</span>
                            {stop.km > 0 && (
                              <span className="text-[10px] text-slate-400 font-mono">({stop.km} km)</span>
                            )}
                          </div>
                        </td>

                        {/* Route */}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{stop.routeName}</span>
                        </td>

                        {/* Bus Number */}
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md font-mono text-xs inline-block">
                            {stop.busNumber}
                          </span>
                        </td>

                        {/* Waiting Students */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-extrabold text-slate-900 text-sm">
                            {stop.waitingStudents} students
                          </span>
                        </td>

                        {/* Demand Level */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border ${getDemandBadgeClass(stop.demandLevel)}`}>
                            {isHighDemand && <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />}
                            <span>{stop.demandLevel}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
