import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  ShieldCheck, 
  RefreshCw, 
  BookOpen, 
  Calendar,
  Lock,
  ArrowRight,
  UserCheck,
  KeyRound,
  Bus,
  Hash
} from 'lucide-react';
import { AttendanceSession, UserRole } from '../types';
import { api } from '../services/api';

interface QRAttendancePageProps {
  sessions: AttendanceSession[];
  onGenerateSession: (sessionData: any) => Promise<AttendanceSession>;
  onScanAttendance: (payload: any) => Promise<{ success: boolean; message: string; sessionStats?: any }>;
  userRole: UserRole;
  onChangeRole: (r: UserRole) => void;
  initialMode?: 'FACULTY' | 'STUDENT' | 'BUS_BOARDING';
}

export const QRAttendancePage: React.FC<QRAttendancePageProps> = ({
  sessions,
  onGenerateSession,
  onScanAttendance,
  userRole,
  onChangeRole,
  initialMode
}) => {
  // Mode selection: Faculty or Student or Bus Boarding
  const [activeMode, setActiveMode] = useState<'FACULTY' | 'STUDENT' | 'BUS_BOARDING'>(
    initialMode || (userRole === 'STUDENT' ? 'STUDENT' : 'FACULTY')
  );

  // Sync role and tab change
  useEffect(() => {
    if (initialMode) {
      setActiveMode(initialMode);
    } else if (activeMode === 'BUS_BOARDING') {
      setActiveMode(userRole === 'STUDENT' ? 'STUDENT' : 'FACULTY');
    } else if (userRole === 'STUDENT') {
      setActiveMode('STUDENT');
    }
  }, [userRole, initialMode]);

  // Bus Boarding PIN state
  const [boardingBusNumber, setBoardingBusNumber] = useState('Bus 31');
  const [boardingPin, setBoardingPin] = useState('3101');
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [boardingError, setBoardingError] = useState<string | null>(null);
  const [confirmedBoardingData, setConfirmedBoardingData] = useState<{
    busNumber: string;
    routeName: string;
    stopName: string;
    time: string;
    occupancyPct?: number;
    newPassengerCount?: number;
    capacity?: number;
  } | null>(null);

  const busPinMap: Record<string, { pin: string; route: string; stop: string }> = {
    'Bus 31': { pin: '3101', route: 'Mangalagiri (Route 1)', stop: 'Kaza Junction' },
    'Bus 32': { pin: '3201', route: 'Benz Circle (Route 2)', stop: 'Gunadala Ring' },
    'Bus 33': { pin: '3301', route: 'Gannavaram (Route 3)', stop: 'Enikepadu Junction' },
    'Bus 34': { pin: '3401', route: 'TransitIQ Standby', stop: 'Central Transit Depot' }
  };

  const handleSelectBusForPin = (busNum: string) => {
    setBoardingBusNumber(busNum);
    setBoardingPin(busPinMap[busNum]?.pin || '3101');
    setBoardingError(null);
  };

  const handleBoardBusUsingPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPin(true);
    setBoardingError(null);

    try {
      const res = await api.confirmBoarding({
        busNumber: boardingBusNumber,
        method: 'PIN',
        pin: boardingPin
      });

      if (res.success) {
        const meta = busPinMap[boardingBusNumber] || { route: 'Transit Route', stop: 'Campus Gate' };
        setConfirmedBoardingData({
          busNumber: res.busNumber || boardingBusNumber,
          routeName: res.route?.name || meta.route,
          stopName: meta.stop,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          occupancyPct: res.occupancyPct,
          newPassengerCount: res.newPassengerCount,
          capacity: res.capacity
        });
      } else {
        setBoardingError(res.error || 'Invalid Boarding PIN. Please check the 4-digit PIN for ' + boardingBusNumber);
      }
    } catch {
      setBoardingError('Network error connecting to transit gateway.');
    } finally {
      setIsSubmittingPin(false);
    }
  };

  const handleResetBusBoarding = async () => {
    try {
      await api.resetBoarding();
    } catch (err) {
      console.warn('Reset boarding err:', err);
    }
    setConfirmedBoardingData(null);
    setBoardingError(null);
  };

  // Current selected active session for faculty
  const [selectedSession, setSelectedSession] = useState<AttendanceSession>(sessions[0] || null);

  // Countdown timer for active QR session
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(300); // 5 minutes default
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!selectedSession) return;
    const expiresAt = new Date(selectedSession.expiresAt).getTime();
    
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeftSeconds(diff);
      if (diff <= 0) {
        setIsExpired(true);
      } else {
        setIsExpired(false);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [selectedSession]);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Faculty form state for generating new session
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState('III');
  const [section, setSection] = useState('A');
  const [subject, setSubject] = useState('Deep Learning & AI Applications (CS312)');
  const [period, setPeriod] = useState('Period 1 (08:45 AM - 09:45 AM)');
  const [expiryMinutes, setExpiryMinutes] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);

  // Student scan state
  const [scannedToken, setScannedToken] = useState(selectedSession?.sessionToken || 'NRIIT-ATT-2026-CSEA-9812');
  const [studentRoll, setStudentRoll] = useState('21NR1A0501');
  const [studentName, setStudentName] = useState('B. Sai Teja');
  const [studentDept, setStudentDept] = useState('CSE');
  const [studentSection, setStudentSection] = useState('A');
  const [scanResult, setScanResult] = useState<{ success?: boolean; message?: string; details?: any } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    const newSession = await onGenerateSession({
      department,
      year,
      section,
      subject,
      period,
      expiryMinutes
    });
    setSelectedSession(newSession);
    setScannedToken(newSession.sessionToken);
    setIsGenerating(false);
    setIsExpired(false);
    setTimeLeftSeconds(expiryMinutes * 60);
  };

  const handleStudentScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setScanResult(null);

    const res = await onScanAttendance({
      sessionToken: scannedToken,
      studentId: studentRoll,
      studentName,
      department: studentDept,
      section: studentSection
    });

    setIsScanning(false);
    if (res.success) {
      setScanResult({
        success: true,
        message: res.message,
        details: {
          student: studentName,
          roll: studentRoll,
          class: `${studentDept}-${studentSection}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Present'
        }
      });
    } else {
      setScanResult({
        success: false,
        message: res.message
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">
              QR-Based Attendance & Mobility Gateway
            </h1>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
              Primary Transit Input
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Secure, time-expiring QR system for campus classrooms. Directly drives downstream AI bus allocation.
          </p>
        </div>

        {/* Mode Toggle Pills (Faculty vs Student vs Bus Boarding) */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs overflow-x-auto touch-scroll max-w-full">
          <button
            onClick={() => {
              setActiveMode('FACULTY');
              onChangeRole('FACULTY');
            }}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-2.5 min-h-[44px] rounded-lg font-bold transition shrink-0 ${
              activeMode === 'FACULTY'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Faculty Mode (Generate QR)</span>
          </button>
          <button
            onClick={() => {
              setActiveMode('STUDENT');
              onChangeRole('STUDENT');
            }}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-2.5 min-h-[44px] rounded-lg font-bold transition shrink-0 ${
              activeMode === 'STUDENT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Student Mode (Scan QR)</span>
          </button>
          <button
            onClick={() => {
              setActiveMode('BUS_BOARDING');
            }}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-2.5 min-h-[44px] rounded-lg font-bold transition shrink-0 ${
              activeMode === 'BUS_BOARDING'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Board Bus (PIN)</span>
          </button>
        </div>
      </div>

      {/* Security Architecture Callout */}
      <div className="bg-sky-50/90 text-sky-950 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs border border-sky-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700 shrink-0">
            <Lock className="w-4 h-4 text-sky-600 shrink-0" />
          </div>
          <div>
            <span className="font-bold text-sky-900">QR Security Protocol: </span>
            <span className="text-slate-600">
              No sensitive student PII is encoded in the QR. It holds only an ephemeral single-session cryptographic token validated on backend.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-sky-700 font-mono font-semibold">
          <span className="bg-sky-100/80 px-2 py-0.5 rounded border border-sky-200">Anti-Proxy</span>
          <span>•</span>
          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">Duplicate-Rejection Active</span>
        </div>
      </div>

      {/* Mode A: FACULTY / ADMIN — GENERATE QR */}
      {activeMode === 'FACULTY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Active QR Display */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center text-center">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="text-left">
                <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                  TransitIQ Attendance
                </span>
                <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                  Scan this QR to mark your attendance
                </h3>
              </div>
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                isExpired ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                {isExpired ? 'Session Expired' : `QR expires in ${formatCountdown(timeLeftSeconds)}`}
              </span>
            </div>

            {/* QR Code Container */}
            <div className="my-6 p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 shadow-inner flex flex-col items-center relative">
              {isExpired ? (
                <div className="w-64 h-64 flex flex-col items-center justify-center text-red-600 bg-red-50/50 rounded-xl">
                  <AlertCircle className="w-12 h-12 mb-2" />
                  <p className="font-bold text-sm">Attendance session expired.</p>
                  <p className="text-xs text-red-500 mt-1 max-w-[200px]">
                    Temporary token has timed out. Please generate a fresh QR session below.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200">
                  <QRCodeSVG 
                    value={selectedSession?.sessionToken || 'NRIIT-ATT-DEMO'}
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              )}

              <p className="text-[11px] font-mono text-slate-500 mt-3 bg-white px-3 py-1 rounded-full border border-slate-200">
                Token: <strong className="text-slate-800">{selectedSession?.sessionToken}</strong>
              </p>
            </div>

            {/* Session Metadata Summary */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-left bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] block">SESSION</span>
                <span className="font-bold text-slate-900">{selectedSession?.department}-{selectedSession?.section} ({selectedSession?.year} Year)</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">DATE</span>
                <span className="font-bold text-slate-900">{new Date().toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">PERIOD</span>
                <span className="font-bold text-slate-900 truncate block">Period 1</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">VERIFIED ATTENDANCE</span>
                <span className="font-bold text-emerald-600 font-mono">
                  {selectedSession?.presentCount || 0} / {selectedSession?.totalStudents || 60} ({selectedSession?.attendancePct || 0}%)
                </span>
              </div>
            </div>

            {/* Switch to Student scan CTA */}
            <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs">
              <span className="text-slate-500">Want to test the student scan experience?</span>
              <button
                onClick={() => setActiveMode('STUDENT')}
                className="text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                <span>Switch to Student Camera Scanner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: Faculty Generator Form */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                Generate Temporary Attendance Session
              </h3>
              <p className="text-xs text-slate-500">
                Configure classroom department, period and time-to-live expiration.
              </p>
            </div>

            <form onSubmit={handleGenerate} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-600 bg-white"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="IT">IT</option>
                    <option value="AIML">AIML</option>
                    <option value="DS">DS</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-600 bg-white"
                  >
                    <option value="I">I Year</option>
                    <option value="II">II Year</option>
                    <option value="III">III Year</option>
                    <option value="IV">IV Year</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Section</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-600 bg-white"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subject & Course Code</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Period & Timetable</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-600 bg-white text-xs"
                  >
                    <option>Period 1 (08:45 AM - 09:45 AM)</option>
                    <option>Period 2 (09:45 AM - 10:45 AM)</option>
                    <option>Period 3 (11:00 AM - 12:00 PM)</option>
                    <option>Period 4 (01:00 PM - 02:00 PM)</option>
                    <option>Period 5 (02:00 PM - 03:00 PM)</option>
                    <option>Period 6 Lab (03:00 PM - 04:30 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Session Expiry Lifespan</label>
                  <select
                    value={expiryMinutes}
                    onChange={(e) => setExpiryMinutes(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 focus:outline-blue-600 bg-white text-xs"
                  >
                    <option value={5}>5 Minutes (Strict Security)</option>
                    <option value={8}>8 Minutes (Standard Lab)</option>
                    <option value={10}>10 Minutes (Extended)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                id="btn-generate-qr"
                className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>{isGenerating ? 'Generating...' : 'Generate New Attendance QR Session'}</span>
              </button>
            </form>

            {/* Recent Sessions list */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Active Classroom Sessions
              </span>
              <div className="space-y-2">
                {sessions.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedSession(s);
                      setScannedToken(s.sessionToken);
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      s.id === selectedSession?.id
                        ? 'border-blue-600 bg-blue-50/60 font-semibold'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900">{s.department}-{s.section} • {s.subject}</p>
                      <p className="text-[11px] text-slate-500">{s.period}</p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-emerald-700 font-bold">{s.presentCount}/{s.totalStudents}</span>
                      <span className="text-[10px] text-slate-400 block">{s.attendancePct}% Present</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode B: STUDENT — SCAN QR */}
      {activeMode === 'STUDENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Camera Scanner Interface */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center">
            <div className="w-full pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Student Check-In
                </span>
                <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                  Scan Attendance QR
                </h3>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                Camera Live
              </span>
            </div>

            {/* Simulated Camera Viewfinder */}
            <div className="my-5 w-full max-w-sm h-64 bg-slate-950 rounded-2xl border-2 border-indigo-500 relative overflow-hidden flex flex-col items-center justify-center text-white shadow-lg">
              {/* Corner markers */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-indigo-400"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-indigo-400"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-indigo-400"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-indigo-400"></div>

              {/* Scanning red line animation */}
              <div className="absolute left-8 right-8 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse"></div>

              <Camera className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-200">Align QR Code within viewfinder</p>
              <p className="text-[10px] text-slate-400 mt-1">TransitIQ Classroom Optical Scanner</p>
            </div>

            <p className="text-xs text-slate-500 text-center max-w-md">
              Point your camera at the faculty board. The token will be captured and authenticated with your registered student roll number.
            </p>
          </div>

          {/* Right: Student Authentication & Submit Form */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                Student Attendance Verification
              </h3>
              <p className="text-xs text-slate-500">
                Confirm your student credentials to mark presence for today's session.
              </p>
            </div>

            <form onSubmit={handleStudentScan} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Captured QR Session Token
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={scannedToken}
                    onChange={(e) => setScannedToken(e.target.value)}
                    placeholder="e.g. NRIIT-ATT-2026-CSEA-9812"
                    className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-blue-600 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setScannedToken(selectedSession?.sessionToken || 'NRIIT-ATT-2026-CSEA-9812')}
                    className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs shrink-0 cursor-pointer"
                    title="Load latest faculty token"
                  >
                    Paste Active QR
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Student Roll Number</label>
                  <input
                    type="text"
                    required
                    value={studentRoll}
                    onChange={(e) => setStudentRoll(e.target.value)}
                    placeholder="21NR1A0501"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Student Name</label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department</label>
                  <select
                    value={studentDept}
                    onChange={(e) => setStudentDept(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-blue-600 bg-white"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="IT">IT</option>
                    <option value="AIML">AIML</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Section</label>
                  <select
                    value={studentSection}
                    onChange={(e) => setStudentSection(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-blue-600 bg-white"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              {/* Duplicate Prevention Test notice */}
              <p className="text-[11px] text-slate-500 italic">
                * Note: Submitting multiple times with the same roll number will trigger the duplicate rejection security check.
              </p>

              <button
                type="submit"
                disabled={isScanning}
                id="btn-submit-attendance"
                className="w-full min-h-[44px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isScanning ? 'Verifying...' : 'Submit Attendance & Register Commute'}</span>
              </button>
            </form>

            {/* Scan Outcome Callout (Exact from Prompt Section 15) */}
            {scanResult && scanResult.success && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>✅ Attendance Marked</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-500">Student:</span>
                    <p className="font-bold text-slate-900">{scanResult.details?.student} ({scanResult.details?.roll})</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Class:</span>
                    <p className="font-bold text-slate-900">{scanResult.details?.class}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Time:</span>
                    <p className="font-bold text-slate-900">{scanResult.details?.time}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span>
                    <p className="font-bold text-emerald-700">Present</p>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-800 pt-1 border-t border-emerald-200">
                  Data propagated to AI mobility engine: Morning transit index updated.
                </p>
              </div>
            )}

            {scanResult && !scanResult.success && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-3.5 text-xs text-red-900 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Attendance Submission Rejected</p>
                  <p className="text-[11px] text-red-700 mt-0.5">{scanResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode C: BOARD BUS USING PIN */}
      {activeMode === 'BUS_BOARDING' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: PIN Entry Interface (Replaces broken camera scanner) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-full pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                    Student Transit Gate
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit']">
                    BOARD BUS USING PIN
                  </h3>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>PIN Authenticated</span>
                </span>
              </div>

              {/* Bus Selector */}
              <div className="mt-4">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Boarded Bus:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Bus 31', 'Bus 32', 'Bus 33', 'Bus 34'].map((bNum) => {
                    const isSelected = boardingBusNumber === bNum;
                    return (
                      <button
                        key={bNum}
                        type="button"
                        onClick={() => handleSelectBusForPin(bNum)}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <Bus className={`w-4 h-4 mx-auto mb-1 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="text-xs block">{bNum}</span>
                        <span className="text-[10px] text-slate-400 font-mono">PIN: {busPinMap[bNum]?.pin}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Entrance Pass Info Banner */}
              <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50/80 border border-sky-200 text-slate-800 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700">
                    <KeyRound className="w-4 h-4 text-sky-700" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Entrance Door Code</span>
                    <span className="text-sm font-bold font-mono text-sky-800">
                      {boardingBusNumber} PIN: {busPinMap[boardingBusNumber]?.pin || '3101'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBoardingPin(busPinMap[boardingBusNumber]?.pin || '3101');
                    setBoardingError(null);
                  }}
                  className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
                >
                  Use PIN: {busPinMap[boardingBusNumber]?.pin}
                </button>
              </div>

              {/* PIN Submission Form */}
              <form onSubmit={handleBoardBusUsingPin} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Enter 4-Digit Boarding PIN
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="input-bus-boarding-pin"
                      required
                      maxLength={4}
                      value={boardingPin}
                      onChange={(e) => {
                        setBoardingPin(e.target.value.replace(/\D/g, ''));
                        setBoardingError(null);
                      }}
                      placeholder="e.g. 3101"
                      className="w-full text-center tracking-[0.4em] text-2xl font-mono font-extrabold bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                    Enter the 4-digit code shown on the physical entrance badge inside {boardingBusNumber}.
                  </p>
                </div>

                {boardingError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <span>{boardingError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-submit-bus-pin"
                  disabled={isSubmittingPin || boardingPin.length !== 4}
                  className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-4 py-3 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>
                    {isSubmittingPin ? 'Verifying PIN...' : `Verify PIN & Board ${boardingBusNumber}`}
                  </span>
                </button>
              </form>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Direct PIN Verification Gateway</span>
              <span className="font-mono text-[11px] text-emerald-700 font-bold">100% Reliable (No Camera Required)</span>
            </div>
          </div>

          {/* Right: Boarding Status Card */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit']">
                    Boarding Verification Pass
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time passenger validation against TransitIQ Registry
                  </p>
                </div>
                {confirmedBoardingData && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                    Active Pass
                  </span>
                )}
              </div>

              {confirmedBoardingData ? (
                <div className="mt-5 bg-emerald-50/80 border border-emerald-300 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-lg">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <span>✓ Boarding Confirmed via PIN</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-emerald-200 text-sm">
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Bus:</span>
                      <p className="font-extrabold text-slate-900 text-base">{confirmedBoardingData.busNumber}</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Route:</span>
                      <p className="font-extrabold text-slate-900 text-base">{confirmedBoardingData.routeName}</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Boarding Stop:</span>
                      <p className="font-extrabold text-slate-900 text-base">{confirmedBoardingData.stopName}</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Confirmed Time:</span>
                      <p className="font-extrabold text-emerald-700 font-mono text-base">{confirmedBoardingData.time}</p>
                    </div>
                  </div>

                  {confirmedBoardingData.occupancyPct !== undefined && (
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs text-xs flex items-center justify-between">
                      <span className="font-bold text-slate-700">Live Bus Occupancy:</span>
                      <span className="font-mono font-extrabold text-emerald-700">
                        {confirmedBoardingData.newPassengerCount} / {confirmedBoardingData.capacity} seats ({confirmedBoardingData.occupancyPct}%)
                      </span>
                    </div>
                  )}

                  <div className="pt-2 text-xs text-emerald-800 font-medium flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>PIN verified. Real-time passenger count updated on Live Bus Monitor.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetBusBoarding}
                    className="w-full min-h-[44px] bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset & Board Another Bus</span>
                  </button>
                </div>
              ) : (
                <div className="mt-6 p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-500">
                  <KeyRound className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">Ready to Authenticate Boarding</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Select your bus, enter the 4-digit PIN (e.g. 3101 for Bus 31), and click "Verify PIN & Board" to securely check in.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-mono">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    <span>PIN replaces camera scanning</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Transit Gate Protocol v3.0</span>
              <span className="font-mono text-[11px] text-emerald-700 font-bold">PIN Fast-Check In</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
