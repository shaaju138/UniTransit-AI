import { College, RouteItem, Vehicle, AttendanceSession, AIAlert, Recommendation, BusAllocation } from '../types';

export const INITIAL_COLLEGES: College[] = [
  {
    id: "nriit-pilot",
    name: "NRI Institute of Technology",
    shortName: "NRIIT",
    tagline: "AI-Powered Campus Mobility & Overcrowding Management",
    address: "Pothavarappadu, Via Nunna, Vijayawada, AP - 521212",
    coordinates: { lat: 16.5815, lng: 80.7384 },
    isPilot: true,
    departments: ["CSE", "ECE", "IT", "AIML", "DS", "MECH", "CIVIL", "EEE"],
    totalBuses: 12,
    activeBuses: 8,
    availableBuses: 4,
    demoStudentPopulation: 2400
  }
];

export const INITIAL_ROUTES: RouteItem[] = [
  {
    id: "route-1",
    routeNumber: 1,
    name: "Route 1 — Mangalagiri to NRIIT",
    slug: "mangalagiri-nriit",
    collegeId: "nriit-pilot",
    origin: "NRI Institute of Technology (Pothavarappadu)",
    destination: "Mangalagiri Bus Complex",
    assignedVehicle: "Bus 31",
    assignedVehicleId: "veh-demo-a",
    capacity: 50,
    currentPassengers: 43,
    predictedPassengers: 58,
    predictedOccupancy: 116,
    riskLevel: "HIGH",
    status: "In Transit",
    currentLocation: "Approaching Chinna Kakani",
    nextStop: "Chinna Kakani",
    etaMinutes: 6,
    stops: [
      { id: "r1-s1", name: "NRI Institute of Technology", km: 0, demand: 0, waitingStudents: 0, predictedAddition: 0, lat: 16.5815, lng: 80.7384 },
      { id: "r1-s2", name: "Pedda Kakani", km: 8.5, demand: 8, waitingStudents: 8, predictedAddition: 3, lat: 16.3450, lng: 80.5050 },
      { id: "r1-s3", name: "Numbur", km: 12.2, demand: 14, waitingStudents: 14, predictedAddition: 5, lat: 16.3680, lng: 80.5220 },
      { id: "r1-s4", name: "Koppuravuru", km: 15.0, demand: 21, waitingStudents: 21, predictedAddition: 7, lat: 16.3910, lng: 80.5400 },
      { id: "r1-s5", name: "Kaza", km: 18.4, demand: 28, waitingStudents: 28, predictedAddition: 9, lat: 16.4258, lng: 80.5620 },
      { id: "r1-s6", name: "Chinna Kakani", km: 21.0, demand: 35, waitingStudents: 35, predictedAddition: 11, lat: 16.4390, lng: 80.5690 },
      { id: "r1-s7", name: "Tenali Bypass", km: 24.3, demand: 18, waitingStudents: 18, predictedAddition: 6, lat: 16.4350, lng: 80.5820 },
      { id: "r1-s8", name: "Mangalagiri", km: 28.0, demand: 12, waitingStudents: 12, predictedAddition: 4, lat: 16.4300, lng: 80.5650 }
    ],
    explanation: "Passenger demand is expected to exceed available capacity based on current occupancy (86%), historical route demand, high morning attendance (94%) and 63 students waiting at upcoming stops (notably Kaza and Chinna Kakani).",
    recommendation: "Deploy standby Bus 34 or reallocate available capacity from low-demand Route 3."
  },
  {
    id: "route-2",
    routeNumber: 2,
    name: "Route 2 — Vijayawada Benz Circle to NRIIT",
    slug: "benz-circle-nriit",
    collegeId: "nriit-pilot",
    origin: "NRI Institute of Technology (Pothavarappadu)",
    destination: "Benz Circle, Vijayawada",
    assignedVehicle: "Bus 32",
    assignedVehicleId: "veh-demo-b",
    capacity: 55,
    currentPassengers: 38,
    predictedPassengers: 44,
    predictedOccupancy: 80,
    riskLevel: "MODERATE",
    status: "In Transit",
    currentLocation: "Near Gunadala Ring",
    nextStop: "Ramavarappadu Ring",
    etaMinutes: 8,
    stops: [
      { id: "r2-s1", name: "NRI Institute of Technology", km: 0, demand: 0, waitingStudents: 0, predictedAddition: 0, lat: 16.5815, lng: 80.7384 },
      { id: "r2-s2", name: "Nunna Village", km: 4.1, demand: 6, waitingStudents: 6, predictedAddition: 2, lat: 16.5650, lng: 80.7020 },
      { id: "r2-s3", name: "Kandrika", km: 8.0, demand: 11, waitingStudents: 11, predictedAddition: 3, lat: 16.5410, lng: 80.6690 },
      { id: "r2-s4", name: "Gunadala", km: 12.3, demand: 15, waitingStudents: 15, predictedAddition: 4, lat: 16.5180, lng: 80.6550 },
      { id: "r2-s5", name: "Ramavarappadu Ring", km: 14.5, demand: 19, waitingStudents: 19, predictedAddition: 5, lat: 16.5120, lng: 80.6620 },
      { id: "r2-s6", name: "Benz Circle", km: 18.2, demand: 14, waitingStudents: 14, predictedAddition: 4, lat: 16.4990, lng: 80.6510 }
    ],
    explanation: "Current occupancy is within safe operational limits (69%). Forecasted passenger influx at Ramavarappadu will bring utilization to 80%, maintaining comfortable safety margins.",
    recommendation: "Maintain standard dispatch timetable; monitor Ramavarappadu boarding."
  },
  {
    id: "route-3",
    routeNumber: 3,
    name: "Route 3 — Gannavaram Airport Corridor to NRIIT",
    slug: "gannavaram-nriit",
    collegeId: "nriit-pilot",
    origin: "NRI Institute of Technology (Pothavarappadu)",
    destination: "Gannavaram Bus Stand",
    assignedVehicle: "Bus 33",
    assignedVehicleId: "veh-demo-c",
    capacity: 45,
    currentPassengers: 19,
    predictedPassengers: 22,
    predictedOccupancy: 49,
    riskLevel: "SAFE",
    status: "In Transit",
    currentLocation: "Enikepadu Junction",
    nextStop: "Kesarapalle",
    etaMinutes: 11,
    stops: [
      { id: "r3-s1", name: "NRI Institute of Technology", km: 0, demand: 0, waitingStudents: 0, predictedAddition: 0, lat: 16.5815, lng: 80.7384 },
      { id: "r3-s2", name: "Nunna Road Cut", km: 3.5, demand: 3, waitingStudents: 3, predictedAddition: 1, lat: 16.5700, lng: 80.7100 },
      { id: "r3-s3", name: "Enikepadu Junction", km: 8.9, demand: 7, waitingStudents: 7, predictedAddition: 2, lat: 16.5300, lng: 80.7100 },
      { id: "r3-s4", name: "Prasadampadu", km: 11.2, demand: 5, waitingStudents: 5, predictedAddition: 1, lat: 16.5200, lng: 80.7000 },
      { id: "r3-s5", name: "Kesarapalle", km: 16.0, demand: 8, waitingStudents: 8, predictedAddition: 2, lat: 16.5380, lng: 80.7720 },
      { id: "r3-s6", name: "Gannavaram Hub", km: 20.4, demand: 6, waitingStudents: 6, predictedAddition: 1, lat: 16.5410, lng: 80.8010 }
    ],
    explanation: "Route occupancy is low (42% current, 49% predicted). Ample spare capacity of 23 seats is available.",
    recommendation: "Vehicle capacity can be partially reassigned or standby shuttle can assist Route 1."
  }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: "veh-demo-a",
    busNumber: "Bus 31",
    name: "Bus 31",
    plateDemo: "AP 16 TX 101",
    assignedRouteId: "route-1",
    routeNumber: 1,
    capacity: 50,
    currentOccupancy: 43,
    status: "In Transit",
    driverName: "Driver R. Narayana",
    phoneDemo: "+91 98480 12345",
    speedKmph: 38,
    currentLocation: "Near Kaza Junction",
    simulatedCoordinates: { lat: 16.4258, lng: 80.5620 },
    lastPing: "Just now"
  },
  {
    id: "veh-demo-b",
    busNumber: "Bus 32",
    name: "Bus 32",
    plateDemo: "AP 16 TX 102",
    assignedRouteId: "route-2",
    routeNumber: 2,
    capacity: 55,
    currentOccupancy: 38,
    status: "In Transit",
    driverName: "Driver M. Prasad",
    phoneDemo: "+91 98480 67890",
    speedKmph: 32,
    currentLocation: "Near Gunadala Ring",
    simulatedCoordinates: { lat: 16.5180, lng: 80.6550 },
    lastPing: "1 min ago"
  },
  {
    id: "veh-demo-c",
    busNumber: "Bus 33",
    name: "Bus 33",
    plateDemo: "AP 16 TX 103",
    assignedRouteId: "route-3",
    routeNumber: 3,
    capacity: 45,
    currentOccupancy: 19,
    status: "In Transit",
    driverName: "Driver T. Srinivasa Rao",
    phoneDemo: "+91 98480 11223",
    speedKmph: 42,
    currentLocation: "Enikepadu Junction",
    simulatedCoordinates: { lat: 16.5300, lng: 80.7100 },
    lastPing: "Just now"
  },
  {
    id: "veh-demo-d",
    busNumber: "Bus 34",
    name: "Bus 34",
    plateDemo: "AP 16 TX 104",
    assignedRouteId: null,
    routeNumber: null,
    capacity: 35,
    currentOccupancy: 0,
    status: "Standby in Depot",
    driverName: "Driver V. Koteswara Rao",
    phoneDemo: "+91 98480 44556",
    speedKmph: 0,
    currentLocation: "NRIIT Campus Depot",
    simulatedCoordinates: { lat: 16.5815, lng: 80.7384 },
    lastPing: "Stationary"
  }
];

export const INITIAL_ALLOCATIONS: BusAllocation = {
  id: "alloc-r1-surge",
  targetRouteId: "route-1",
  targetRouteName: "Route 1 — Mangalagiri to NRIIT",
  assignedBusId: "veh-demo-a",
  assignedBusName: "Assigned Vehicle A (Transit Fleet)",
  currentPassengers: 43,
  busCapacity: 50,
  predictedDemand: 58,
  predictedOccupancy: 116,
  overflowCount: 8,
  riskLevel: "HIGH",
  aiRecommendationText: "Predicted demand exceeds the assigned bus capacity by 8 passengers. An available nearby NRIIT bus should be assigned to support this route.",
  reasons: [
    "Attendance increased: Morning attendance in CSE & ECE lab sessions registered at 94%.",
    "Historical demand is high: Morning 08:30 - 09:00 AM window carries the highest Period 1 commute load.",
    "Current bus occupancy is high: Assigned Vehicle A already has 43 passengers on board (86% full).",
    "Upcoming stop demand is high: 28 students are queued at Kaza and 35 students at Chinna Kakani.",
    "Available capacity is insufficient: Physical shortage of 8 seats creates high overcrowding risk."
  ],
  availableSupportBuses: [
    {
      busId: "veh-demo-d",
      busName: "Assigned Standby Vehicle D",
      currentRoute: "NRIIT Campus Depot (Standby)",
      capacity: 35,
      availableSeats: 35,
      proximity: "5.2 km / 8 mins to Chinna Kakani (Simulated GPS Proximity)",
      recommendationNote: "Primary Recommended Support: Immediate depot dispatch to intercept Chinna Kakani stop.",
      isRecommendedPrimary: true
    },
    {
      busId: "veh-demo-c",
      busName: "Assigned Vehicle C",
      currentRoute: "Route 3 (Gannavaram Corridor)",
      capacity: 45,
      availableSeats: 26,
      proximity: "9.8 km / 14 mins to Tenali Bypass (Simulated Proximity)",
      recommendationNote: "Secondary Reallocation: Route 3 running at only 49% capacity; can absorb eastern passengers.",
      isRecommendedPrimary: false
    }
  ],
  status: "pending"
};

export const INITIAL_SESSIONS: AttendanceSession[] = [
  {
    id: "sess-cse-a-01",
    sessionToken: "NRIIT-ATT-2026-CSEA-9812",
    department: "CSE",
    year: "III",
    section: "A",
    subject: "Deep Learning & AI Applications (CS312)",
    period: "Period 1 (08:45 AM - 09:45 AM)",
    room: "Room 304, APJ Abdul Kalam Block",
    facultyName: "Dr. K. Srinivas (HOD CSE)",
    totalStudents: 60,
    presentCount: 54,
    attendancePct: 90,
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
    status: "Active"
  },
  {
    id: "sess-ece-b-02",
    sessionToken: "NRIIT-ATT-2026-ECEB-4190",
    department: "ECE",
    year: "III",
    section: "B",
    subject: "Embedded Systems & IoT (EC314)",
    period: "Period 1 (08:45 AM - 09:45 AM)",
    room: "Room 202, Visvesvaraya Block",
    facultyName: "Prof. P. Lakshmi Devi",
    totalStudents: 60,
    presentCount: 56,
    attendancePct: 93,
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 60000).toISOString(),
    status: "Active"
  }
];

export const INITIAL_ALERTS: AIAlert[] = [
  {
    id: "alt-01",
    type: "CRITICAL_OVERCROWDING",
    severity: "danger",
    routeId: "route-1",
    title: "High Overcrowding Alert: Route 1",
    message: "Route 1 (Mangalagiri) predicted to reach 116% capacity (58/50 passengers) within 25 minutes. High boarding demand at Kaza & Chinna Kakani.",
    timestamp: "5 mins ago",
    status: "active"
  },
  {
    id: "alt-02",
    type: "ATTENDANCE_SURGE",
    severity: "warning",
    routeId: "route-1",
    title: "Attendance Spike Detected",
    message: "CSE & ECE 3rd Year morning attendance registered at 93.8%, increasing inbound travel index by +19.4% above Tuesday baseline.",
    timestamp: "15 mins ago",
    status: "active"
  },
  {
    id: "alt-03",
    type: "CAPACITY_WARNING",
    severity: "info",
    routeId: "route-2",
    title: "Moderate Influx on Route 2",
    message: "Route 2 approaching 80% occupancy near Ramavarappadu Ring. Within operating tolerance.",
    timestamp: "30 mins ago",
    status: "acknowledged"
  }
];

export const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "rec-r1-deploy",
    routeId: "route-1",
    routeName: "Route 1 — Mangalagiri to NRIIT",
    title: "Deploy Standby Assigned Vehicle D",
    category: "CAPACITY_ADDITION",
    riskTarget: "HIGH (116% Predicted)",
    explanation: "Route 1 is predicted to exceed passenger capacity by 8 passengers due to surge boarding at Kaza (28) and Chinna Kakani (35) combined with 94% CSE/ECE morning attendance.",
    action: "Deploy 35-seat Standby Assigned Vehicle D from NRIIT campus depot to intercept Chinna Kakani stop at 08:35 AM.",
    urgency: "Immediate",
    status: "pending",
    impact: "Reduces Route 1 occupancy from 116% to 68% (SAFE)"
  },
  {
    id: "rec-r3-reallocate",
    routeId: "route-3",
    routeName: "Route 3 — Gannavaram to NRIIT",
    title: "Reallocate Spare Capacity",
    category: "LOAD_BALANCING",
    riskTarget: "LOW (49% Predicted)",
    explanation: "Route 3 has 23 vacant seats. Dynamic rebalancing can shift 12 boarding passes from Tenali Bypass corridor to feeder minibus.",
    action: "Activate feeder micro-shuttle for Tenali Bypass junction.",
    urgency: "Moderate",
    status: "pending",
    impact: "Optimizes network utilization across eastern corridor"
  }
];
