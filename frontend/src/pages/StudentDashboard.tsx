import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Hash, 
  Clock, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  RotateCcw,
  Check,
  ChevronRight,
  Info,
  CheckSquare
} from 'lucide-react';
import { api } from '../services/api';
import { Vehicle, BoardingRecord, AuthUser } from '../types';

interface StudentDashboardProps {
  currentUser: AuthUser;
  vehicles: Vehicle[];
  onRefreshData?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  vehicles: initialVehicles,
  onRefreshData
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [selectedBusId, setSelectedBusId] = useState<string>('veh-demo-a');
  const [boardingRecord, setBoardingRecord] = useState<BoardingRecord | null>(null);
  const [hasBoarded, setHasBoarded] = useState<boolean>(false);
  const [activeBoardingMethod, setActiveBoardingMethod] = useState<'PIN' | 'MANUAL'>('PIN');
  const [studentEnteredPin, setStudentEnteredPin] = useState<string>('3101');
  
  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  
  // Feedback Messages
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; details?: any } | null>(null);

  // Sync vehicles when initialVehicles changes
  useEffect(() => {
    if (initialVehicles && initialVehicles.length > 0) {
      setVehicles(initialVehicles);
    }
  }, [initialVehicles]);

  // Load student boarding status & live vehicles on mount and poll periodically
  const fetchBoardingAndVehicles = async () => {
    try {
      const [statusRes, vehRes] = await Promise.all([
        api.getBoardingStatus(),
        api.getVehicles()
      ]);

      if (statusRes && statusRes.success) {
        setHasBoarded(statusRes.hasBoarded);
        setBoardingRecord(statusRes.record);
        if (statusRes.record && statusRes.record.busId) {
          setSelectedBusId(statusRes.record.busId);
        }
      }

      if (vehRes && Array.isArray(vehRes)) {
        setVehicles(vehRes);
      }
    } catch (err) {
      console.warn('StudentDashboard data fetch error:', err);
    }
  };

  useEffect(() => {
    fetchBoardingAndVehicles();
    const interval = setInterval(fetchBoardingAndVehicles, 4000);
    return () => clearInterval(interval);
  }, []);

  // Determine current selected bus
  const selectedBus = vehicles.find(v => v.id === selectedBusId || v.busNumber === selectedBusId) || vehicles[0] || {
    id: 'veh-demo-a',
    busNumber: 'Bus 31',
    name: 'Bus 31 (Assigned Vehicle A)',
    plateDemo: 'AP 16 DEMO 101',
    capacity: 50,
    currentOccupancy: 24,
    status: 'In Transit',
    driverName: 'Driver R. Narayana',
    phoneDemo: '+91 98480 12345',
    currentLocation: 'Near Kaza Junction',
    assignedRouteId: 'route-1'
  };

  const occupancyPct = Math.round(((selectedBus.currentOccupancy || 0) / (selectedBus.capacity || 50)) * 100);

  // Sync PIN default when selected bus changes
  useEffect(() => {
    if (selectedBus) {
      setStudentEnteredPin(selectedBus.boardingPin || (selectedBus.busNumber ? selectedBus.busNumber.replace(/\D/g, '') + '01' : '3101'));
    }
  }, [selectedBus.id, selectedBus.busNumber, selectedBus.boardingPin]);

  // Handler: Confirm Boarding
  const handleExecuteBoarding = async (method: 'MANUAL' | 'PIN' = 'PIN', pinToUse?: string) => {
    if (hasBoarded) {
      setFeedback({
        type: 'error',
        message: `Duplicate Boarding Blocked: You are already boarded on ${boardingRecord?.busNumber || selectedBus.busNumber}. Passenger count cannot be increased multiple times for the same trip.`
      });
      setShowConfirmModal(false);
      return;
    }

    setIsConfirming(true);
    setFeedback(null);

    const pinVal = pinToUse !== undefined ? pinToUse : studentEnteredPin;

    try {
      const res = await api.confirmBoarding({
        busId: selectedBus.id,
        busNumber: selectedBus.busNumber || 'Bus 31',
        method: method,
        pin: method === 'PIN' ? pinVal : undefined
      });

      if (res.success && res.record) {
        setHasBoarded(true);
        setBoardingRecord(res.record);
        setFeedback({
          type: 'success',
          message: `✅ Boarding Confirmed on ${res.busNumber || selectedBus.busNumber}! Welcome aboard.`,
          details: {
            busNumber: res.busNumber || selectedBus.busNumber,
            timestamp: new Date(res.record.boardingTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            newCount: res.newPassengerCount,
            capacity: res.capacity,
            occupancy: res.occupancyPct,
            method: method === 'PIN' ? 'PIN Verified' : 'Manual Selection'
          }
        });

        // Refresh vehicles list immediately
        const updatedVehs = await api.getVehicles();
        if (updatedVehs) setVehicles(updatedVehs);
        if (onRefreshData) onRefreshData();
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Boarding confirmation failed. Please check the entered PIN.'
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Could not connect to the campus transit server. Please check your network connection.'
      });
    } finally {
      setIsConfirming(false);
      setShowConfirmModal(false);
    }
  };

  // Handler: Reset Boarding (Demo Mode)
  const handleResetBoarding = async () => {
    try {
      const res = await api.resetBoarding();
      if (res.success) {
        setHasBoarded(false);
        setBoardingRecord(null);
        setFeedback({
          type: 'success',
          message: 'Your boarding record has been reset. You may now test confirming boarding again.'
        });
        const updatedVehs = await api.getVehicles();
        if (updatedVehs) setVehicles(updatedVehs);
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      console.warn('Reset error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Student Identity Profile */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50/50 via-teal-50/30 to-transparent rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified TransitIQ Student Profile</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Department of {currentUser?.department || 'Computer Science & Engineering'}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight">
              Student Transit Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Live bus boarding confirmation & real-time campus passenger occupancy
            </p>
          </div>

          {/* Student ID Card Badge (Light Blue Gradient) */}
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-2xl p-4 shadow-md shadow-sky-500/20 flex items-center gap-4 min-w-[280px] card-hover">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-lg text-white font-['Outfit'] border border-white/30 shadow-inner">
              {currentUser?.fullName?.charAt(0) || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-sm font-bold truncate text-white">{currentUser?.fullName || 'Student'}</p>
                <span className="text-[10px] bg-white/20 text-white font-mono font-bold px-1.5 py-0.5 rounded border border-white/30">
                  STUDENT
                </span>
              </div>
              <p className="text-xs text-sky-100 font-mono mt-0.5">
                Roll No: <span className="text-white font-bold">{currentUser?.rollNumber || 'Not Set'}</span>
              </p>
              <p className="text-[11px] text-sky-50 mt-0.5">
                Stop: <span className="text-white font-medium">{currentUser?.busStop || 'Benz Circle'}</span> • Assigned: <span className="text-emerald-300 font-bold">{currentUser?.assignedBus || 'Bus 31'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 animate-in fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' 
            : 'bg-red-50/90 border-red-200 text-red-900'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-bold">{feedback.message}</p>
            {feedback.details && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/60 text-xs">
                <div>
                  <span className="text-emerald-700">Bus:</span>
                  <p className="font-bold text-slate-900">{feedback.details.busNumber}</p>
                </div>
                <div>
                  <span className="text-emerald-700">Boarding Time:</span>
                  <p className="font-bold text-slate-900">{feedback.details.timestamp}</p>
                </div>
                <div>
                  <span className="text-emerald-700">Passenger Count:</span>
                  <p className="font-bold text-slate-900">{feedback.details.newCount} / {feedback.details.capacity}</p>
                </div>
                <div>
                  <span className="text-emerald-700">Occupancy:</span>
                  <p className="font-bold text-emerald-800">{feedback.details.occupancy}%</p>
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => setFeedback(null)} 
            className="text-slate-400 hover:text-slate-600 font-bold ml-auto p-1"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. Boarding Status & Selected Bus Card (Prompt Exact Format Requirement) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Boarding State & Prompt Format Callout */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  hasBoarded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
                    Current Boarding Status
                  </h2>
                  <p className="text-xs text-slate-500">Live trip confirmation state</p>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-2xs ${
                hasBoarded 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-amber-500 text-white animate-pulse'
              }`}>
                {hasBoarded ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                <span>{hasBoarded ? 'Boarded' : 'Not Boarded'}</span>
              </span>
            </div>

            {/* Structured Example Callout (Exact user specification) */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 font-sans uppercase tracking-wider text-[11px]">
                  Boarding Manifest Telemetry
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full font-sans">
                  Active Trip
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 text-[11px]">Student:</span>
                  <p className="text-slate-900 font-bold text-sm">{currentUser?.fullName || 'Student'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Roll Number:</span>
                  <p className="text-slate-900 font-bold text-sm font-mono">{currentUser?.rollNumber || 'Not Set'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Registered Bus Stop:</span>
                  <p className="text-slate-900 font-bold text-sm">{currentUser?.busStop || 'Benz Circle'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Assigned Bus:</span>
                  <p className="text-emerald-700 font-bold text-sm">{currentUser?.assignedBus || selectedBus.busNumber || 'Bus 31'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Selected Bus:</span>
                  <p className="text-blue-700 font-bold text-sm">{selectedBus.busNumber || 'Bus 31'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Seating Capacity:</span>
                  <p className="text-slate-900 font-bold text-sm">{selectedBus.capacity || 50} seats</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Current Passengers:</span>
                  <p className="text-emerald-700 font-bold text-base">
                    {selectedBus.currentOccupancy || 0} passengers
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Boarding Status:</span>
                  <p className={`font-bold text-sm ${hasBoarded ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {hasBoarded ? 'Boarded' : 'Not Boarded'}
                  </p>
                </div>
              </div>

              {/* Dynamic Occupancy Bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] mb-1 font-sans">
                  <span className="text-slate-600 font-medium">Bus Seating Utilization</span>
                  <span className="font-bold text-slate-900">{occupancyPct}% Occupancy</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
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

            {/* Boarding History Details if Boarded */}
            {hasBoarded && boardingRecord && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-emerald-900">
                    Boarding Recorded on {boardingRecord.busNumber}
                  </p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Recorded at {new Date(boardingRecord.boardingTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} via {boardingRecord.method === 'PIN' ? 'Bus Entry PIN' : boardingRecord.method === 'QR_CODE' ? 'Bus QR' : 'Manual Bus Portal'}.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-reset-boarding"
                  onClick={handleResetBoarding}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-300 transition flex items-center gap-1 cursor-pointer"
                  title="Reset boarding to re-test the scenario"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Test</span>
                </button>
              </div>
            )}
          </div>

          {/* Prominent Confirm Bus Boarding CTA Button */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              id="btn-confirm-boarding"
              disabled={hasBoarded || isConfirming}
              onClick={() => {
                if (hasBoarded) {
                  setFeedback({
                    type: 'error',
                    message: `Duplicate Boarding Blocked: Student ${currentUser?.fullName} (ID: ${currentUser?.rollNumber}) is already recorded as Boarded on ${boardingRecord?.busNumber || selectedBus.busNumber}.`
                  });
                  return;
                }
                setShowConfirmModal(true);
              }}
              className={`w-full flex-1 min-h-[50px] font-bold py-3.5 px-6 rounded-2xl transition duration-150 shadow-md flex items-center justify-center gap-2.5 text-sm sm:text-base cursor-pointer ${
                hasBoarded
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white hover:shadow-lg shadow-emerald-600/20'
              }`}
            >
              {hasBoarded ? (
                <>
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                  <span>Boarding Confirmed on {boardingRecord?.busNumber || selectedBus.busNumber}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>Confirm Bus Boarding ({selectedBus.busNumber || 'Bus 31'})</span>
                </>
              )}
            </button>

            {/* Bus Entrance PIN Badge */}
            <div className="w-full sm:w-auto px-4 py-3 bg-emerald-50 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Door PIN: <strong className="font-mono text-emerald-700 text-sm">{selectedBus.boardingPin || '3101'}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Boarding Confirmation Method Selection (QR Code vs Manual) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
                Boarding Verification Gate
              </h2>
              <p className="text-xs text-slate-500">Choose your preferred confirmation method</p>

              {/* Mode Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl mt-3 border border-slate-200/80">
                <button
                  type="button"
                  id="tab-method-pin"
                  onClick={() => setActiveBoardingMethod('PIN')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeBoardingMethod === 'PIN'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Board Bus with PIN</span>
                </button>
                <button
                  type="button"
                  id="tab-method-manual"
                  onClick={() => setActiveBoardingMethod('MANUAL')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeBoardingMethod === 'MANUAL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Bus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Fleet Selection</span>
                </button>
              </div>
            </div>

            {/* Tab A: PIN Verification Mode (Replaces broken camera scanner) */}
            {activeBoardingMethod === 'PIN' && (
              <div className="mt-4 flex flex-col items-center text-center space-y-3.5">
                {/* Clean PIN Card in Light Blue Theme */}
                <div className="w-full bg-gradient-to-br from-sky-50 to-blue-50/70 rounded-2xl border border-sky-200/90 p-4 text-slate-900 shadow-xs card-hover">
                  <div className="flex items-center justify-between pb-2 border-b border-sky-200/60">
                    <span className="text-[10px] text-sky-800 font-mono uppercase tracking-wider font-semibold">
                      Physical Entrance Door Code
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Active Gate
                    </span>
                  </div>

                  <div className="my-3 flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0 shadow-2xs">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium">Target Vehicle</p>
                        <p className="text-base font-extrabold text-slate-900 font-['Outfit']">
                          {selectedBus.busNumber || 'Bus 31'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-medium">Entrance PIN</p>
                      <p className="text-base font-mono font-extrabold text-sky-600">
                        {selectedBus.boardingPin || '3101'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStudentEnteredPin(selectedBus.boardingPin || '3101')}
                    className="w-full py-1.5 px-3 bg-white hover:bg-sky-100/60 text-sky-700 text-xs font-bold rounded-lg border border-sky-200 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Use Bus PIN ({selectedBus.boardingPin || '3101'})</span>
                  </button>
                </div>

                {/* 4-digit PIN input */}
                <div className="w-full text-left space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Enter 4-Digit Boarding PIN:
                  </label>
                  <input
                    type="text"
                    id="input-student-bus-pin"
                    maxLength={4}
                    value={studentEnteredPin}
                    onChange={(e) => setStudentEnteredPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 3101"
                    className="w-full text-center tracking-[0.4em] text-xl font-mono font-extrabold bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                  <p className="text-[10px] text-slate-400 text-center">
                    Check the 4-digit placard next to driver seat or door.
                  </p>
                </div>

                <button
                  type="button"
                  id="btn-pin-confirm"
                  disabled={hasBoarded || isConfirming || studentEnteredPin.length !== 4}
                  onClick={() => handleExecuteBoarding('PIN', studentEnteredPin)}
                  className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {hasBoarded
                      ? `Already Boarded on ${boardingRecord?.busNumber || selectedBus.busNumber}`
                      : isConfirming
                      ? 'Verifying PIN...'
                      : `Verify PIN & Board ${selectedBus.busNumber || 'Bus 31'}`}
                  </span>
                </button>
              </div>
            )}

            {/* Tab B: Manual Bus Selection Mode */}
            {activeBoardingMethod === 'MANUAL' && (
              <div className="mt-4 space-y-2.5">
                <p className="text-xs text-slate-500 mb-1">
                  Select the bus you have boarded from the active fleet:
                </p>
                
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {vehicles.map((v) => {
                    const isSelected = v.id === selectedBus.id;
                    const bOccupancy = Math.round((v.currentOccupancy / v.capacity) * 100);

                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedBusId(v.id)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected 
                            ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs' 
                            : 'bg-slate-50 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {v.busNumber?.replace('Bus ', '') || 'B'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{v.busNumber || v.name}</span>
                              <span className="text-[10px] text-slate-500">({v.plateDemo})</span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {v.driverName} • {v.currentLocation}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900">
                            {v.currentOccupancy} / {v.capacity}
                          </span>
                          <p className={`text-[10px] font-bold ${
                            bOccupancy >= 100 ? 'text-red-600' : bOccupancy >= 75 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {bOccupancy}% load
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Authentication: Token Verified</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Live Sync Active
            </span>
          </div>
        </div>
      </div>

      {/* 3. Available College Buses Fleet Grid */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">
              Available College Transit Buses
            </h2>
            <p className="text-xs text-slate-500">
              Institutional transport fleet status for NRI Institute of Technology
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full w-fit">
            {vehicles.length} Vehicles in Campus Telemetry
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {vehicles.map((v) => {
            const isSelected = v.id === selectedBus.id;
            const bPct = Math.round((v.currentOccupancy / v.capacity) * 100);

            return (
              <div
                key={v.id}
                onClick={() => setSelectedBusId(v.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/50 border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                    Selected
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                      <Bus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">
                        {v.busNumber || v.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">{v.plateDemo}</p>
                    </div>
                  </div>

                  {/* Route & Driver details */}
                  <div className="space-y-1 text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100">
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{v.currentLocation}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{v.driverName}</span>
                    </p>
                  </div>
                </div>

                {/* Occupancy Progress */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Occupancy</span>
                    <span className="font-bold text-slate-900">{v.currentOccupancy} / {v.capacity}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        bPct >= 100 ? 'bg-red-500' : bPct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(bPct, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-slate-400">{v.status}</span>
                    <span className={`font-bold ${
                      bPct >= 100 ? 'text-red-600' : bPct >= 75 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {bPct}% Full
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Bus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-['Outfit']">
                    Confirm Bus Boarding
                  </h3>
                  <p className="text-xs text-slate-500">Verify your travel details</p>
                </div>
              </div>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to register your boarding on <strong>{selectedBus.busNumber}</strong>? Your passenger count update will immediately sync with the central transport dispatch.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Commuter:</span>
                <span className="font-bold text-slate-900">{currentUser?.fullName} ({currentUser?.rollNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Selected Vehicle:</span>
                <span className="font-bold text-blue-700">{selectedBus.busNumber} ({selectedBus.plateDemo})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Current Passengers:</span>
                <span className="font-bold text-slate-900">{selectedBus.currentOccupancy} seats</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-500 font-sans">New Passenger Count:</span>
                <span className="font-bold text-emerald-700">{selectedBus.currentOccupancy + 1} seats (+1)</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-modal-confirm-submit"
                disabled={isConfirming}
                onClick={() => handleExecuteBoarding('MANUAL')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isConfirming ? (
                  <span>Recording Boarding...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Board</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
