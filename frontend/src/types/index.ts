export type RiskLevel = 'SAFE' | 'MODERATE' | 'HIGH';

export interface College {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  address: string;
  coordinates: { lat: number; lng: number };
  isPilot: boolean;
  departments: string[];
  totalBuses: number;
  activeBuses: number;
  availableBuses: number;
  demoStudentPopulation: number;
}

export interface Stop {
  id: string;
  name: string;
  km: number;
  demand: number;
  lat?: number;
  lng?: number;
  waitingStudents?: number;
  predictedAddition?: number;
}

export interface RouteItem {
  id: string;
  routeNumber: number;
  name: string;
  slug: string;
  collegeId: string;
  origin: string;
  destination: string;
  assignedVehicle: string;
  assignedVehicleId?: string;
  capacity: number;
  currentPassengers: number;
  predictedPassengers: number;
  predictedOccupancy: number;
  riskLevel: RiskLevel;
  status: string;
  currentLocation: string;
  nextStop: string;
  etaMinutes: number;
  stops: Stop[];
  explanation: string;
  recommendation: string;
}

export interface Vehicle {
  id: string;
  busNumber?: string;
  name: string;
  plateDemo: string;
  assignedRouteId: string | null;
  routeNumber: number | null;
  capacity: number;
  currentOccupancy: number;
  status: string;
  driverName: string;
  phoneDemo: string;
  speedKmph: number;
  currentLocation: string;
  boardingPin?: string;
  simulatedCoordinates: { lat: number; lng: number };
  lastPing: string;
}

export interface BusAllocation {
  id: string;
  targetRouteId: string;
  targetRouteName: string;
  assignedBusId: string;
  assignedBusName: string;
  currentPassengers: number;
  busCapacity: number;
  predictedDemand: number;
  predictedOccupancy: number;
  overflowCount: number;
  riskLevel: RiskLevel;
  aiRecommendationText: string;
  reasons: string[];
  availableSupportBuses: {
    busId: string;
    busName: string;
    currentRoute: string;
    capacity: number;
    availableSeats: number;
    proximity: string;
    recommendationNote: string;
    isRecommendedPrimary: boolean;
  }[];
  status: 'pending' | 'allocated' | 'dispatched';
}

export interface AttendanceSession {
  id: string;
  sessionToken: string;
  department: string;
  year: string;
  section: string;
  subject: string;
  period: string;
  room?: string;
  facultyName: string;
  totalStudents: number;
  presentCount: number;
  attendancePct: number;
  createdAt: string;
  expiresAt: string;
  status: 'Active' | 'Expired';
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  department: string;
  section: string;
  markedAt: string;
  status: string;
}

export interface AIAlert {
  id: string;
  type: string;
  severity: 'danger' | 'warning' | 'info';
  routeId: string;
  title: string;
  message: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export interface Recommendation {
  id: string;
  routeId: string;
  routeName: string;
  title: string;
  category: string;
  riskTarget: string;
  explanation: string;
  action: string;
  urgency: 'Immediate' | 'Moderate' | 'Low';
  status: 'pending' | 'applied';
  impact: string;
}

export type UserRole = 'ADMIN' | 'STUDENT';

export interface BoardingRecord {
  id: string;
  studentId: string;
  rollNumber: string;
  studentName: string;
  department?: string;
  busId: string;
  busNumber: string;
  routeId?: string;
  routeName?: string;
  boardingTimestamp: string;
  status: 'Boarded' | 'Not Boarded';
  method: 'QR_CODE' | 'MANUAL' | 'PIN';
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  rollNumber?: string;
  year?: string;
  section?: string;
  busStop?: string;
  assignedBus?: string;
  phoneNumber?: string;
  phone?: string;
}
