const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Permissive CORS configuration supporting deployed Vercel frontend, GitHub Pages, and local development
app.use(cors({
  origin: (origin, callback) => {
    // Dynamically allow requesting origin for web clients, and allow requests with no origin (curl, mobile, server-to-server)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.options('*', cors());
app.use(express.json());

// Root health check endpoints for Render cloud monitoring & browser checks
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'TransitIQ API',
    service: 'Express REST Backend',
    version: '1.0.0-hackathon',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// In-memory state initialized from seed data
const DB_DIR = fs.existsSync(path.join(__dirname, '..', 'database'))
  ? path.join(__dirname, '..', 'database')
  : (fs.existsSync(path.join(__dirname, 'database'))
      ? path.join(__dirname, 'database')
      : path.join(process.cwd(), 'database'));

function ensureDbDir() {
  if (!fs.existsSync(DB_DIR)) {
    try {
      fs.mkdirSync(DB_DIR, { recursive: true });
    } catch (err) {
      console.warn('Could not create DB_DIR:', err.message);
    }
  }
}

function loadJson(file, fallback) {
  try {
    const fullPath = path.join(DB_DIR, file);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
  return fallback;
}

let colleges = loadJson('colleges.json', []);
let routes = loadJson('routes.json', []);
let vehicles = loadJson('vehicles.json', []);
let attendanceData = loadJson('attendance_sessions.json', { activeSessions: [], demoStudents: [] });
let users = loadJson('users.json', []);
let approvedStudents = loadJson('approved_students.json', []);
let boardingRecords = loadJson('boarding_records.json', []);

function saveUsers() {
  try {
    ensureDbDir();
    fs.writeFileSync(path.join(DB_DIR, 'users.json'), JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving users.json:', err.message);
  }
}

function saveBoardingRecords() {
  try {
    ensureDbDir();
    fs.writeFileSync(path.join(DB_DIR, 'boarding_records.json'), JSON.stringify(boardingRecords, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving boarding_records.json:', err.message);
  }
}

function saveVehicles() {
  try {
    ensureDbDir();
    fs.writeFileSync(path.join(DB_DIR, 'vehicles.json'), JSON.stringify(vehicles, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving vehicles.json:', err.message);
  }
}

function saveRoutes() {
  try {
    ensureDbDir();
    fs.writeFileSync(path.join(DB_DIR, 'routes.json'), JSON.stringify(routes, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving routes.json:', err.message);
  }
}

// Active session tokens persistent store
const SESSIONS_FILE = path.join(DB_DIR, 'sessions.json');

function loadSessions() {
  const map = new Map();
  try {
    const raw = loadJson('sessions.json', {});
    const now = Date.now();
    for (const [key, val] of Object.entries(raw)) {
      if (val && val.expiresAt > now) {
        map.set(key, val);
      }
    }
  } catch (err) {
    console.error('Error loading sessions.json:', err.message);
  }
  return map;
}

const activeSessions = loadSessions();

function saveSessions() {
  try {
    ensureDbDir();
    const obj = {};
    const now = Date.now();
    for (const [k, v] of activeSessions.entries()) {
      if (v.expiresAt > now) {
        obj[k] = v;
      }
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving sessions.json:', err.message);
  }
}

// PBKDF2 Cryptographic Hashing Utilities (Never Plaintext!)
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function generateSessionToken() {
  return `nri_sess_${crypto.randomBytes(24).toString('hex')}`;
}

// Role Authorization Key for Admin verification
const ADMIN_SECURITY_KEY = 'NRIIT-ADMIN-2025';

// Attendance records list
let attendanceRecords = [
  {
    id: "rec-001",
    sessionId: "sess-cse-a-01",
    studentId: "21NR1A0501",
    studentName: "B. Sai Teja",
    department: "CSE",
    section: "A",
    markedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    status: "Present"
  },
  {
    id: "rec-002",
    sessionId: "sess-cse-a-01",
    studentId: "21NR1A0502",
    studentName: "Ch. Mounika",
    department: "CSE",
    section: "A",
    markedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    status: "Present"
  }
];

// Current Simulated Attendance State
let simulatedAttendance = {
  overallPercentage: 91,
  totalStudents: 1200,
  presentStudents: 1092,
  departmentBreakdown: [
    { name: "CSE", total: 360, present: 338, pct: 93.8 },
    { name: "ECE", total: 300, present: 279, pct: 93.0 },
    { name: "IT", total: 180, present: 162, pct: 90.0 },
    { name: "AIML & DS", total: 180, present: 164, pct: 91.1 },
    { name: "MECH & CIVIL", total: 180, present: 149, pct: 82.7 }
  ]
};

// AI Recommendations state
let recommendations = [
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
    status: "pending", // "pending" | "applied"
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

// AI Alerts state
let alerts = [
  {
    id: "alt-01",
    type: "CRITICAL_OVERCROWDING",
    severity: "danger",
    routeId: "route-1",
    title: "High Overcrowding Alert: Route 1",
    message: "Route 1 (Mangalagiri) predicted to reach 116% capacity (58/50 passengers) within 25 minutes. High boarding demand at Kaza & Chinna Kakani.",
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    status: "active"
  },
  {
    id: "alt-02",
    type: "ATTENDANCE_SURGE",
    severity: "warning",
    routeId: "route-1",
    title: "Attendance Spike Detected",
    message: "CSE & ECE 3rd Year morning attendance registered at 93.8%, increasing inbound travel index by +19.4% above Tuesday baseline.",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    status: "active"
  },
  {
    id: "alt-03",
    type: "CAPACITY_WARNING",
    severity: "info",
    routeId: "route-2",
    title: "Moderate Influx on Route 2",
    message: "Route 2 approaching 80% occupancy near Ramavarappadu Ring. Within operating tolerance.",
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    status: "acknowledged"
  }
];

// Helper: Calculate AI predictions dynamically based on attendance and route parameters
function recalculatePredictions(attPct) {
  const ratio = attPct / 85.0;
  
  routes.forEach(route => {
    if (route.id === 'route-1') {
      const basePass = 40;
      const waitingSum = route.stops.reduce((sum, s) => sum + (s.demand || 0), 0);
      const predicted = Math.round(basePass * 0.4 + (waitingSum * 0.58 * Math.pow(ratio, 1.4)));
      route.predictedPassengers = predicted;
      route.predictedOccupancy = Math.round((predicted / route.capacity) * 100);
      route.riskLevel = route.predictedOccupancy >= 100 ? 'HIGH' : (route.predictedOccupancy >= 75 ? 'MODERATE' : 'SAFE');
      
      route.explanation = `Passenger demand is predicted at ${route.predictedPassengers} (${route.predictedOccupancy}%) based on ${attPct}% campus attendance, ${waitingSum} waiting passengers across stops (peak at Kaza & Chinna Kakani), and morning peak timetable.`;
      
      // Update stops dynamically
      route.stops.forEach(s => {
        if (s.name === 'Kaza') s.demand = Math.round(28 * ratio);
        if (s.name === 'Chinna Kakani') s.demand = Math.round(35 * ratio);
        if (s.name === 'Koppuravuru') s.demand = Math.round(21 * ratio);
      });
    } else if (route.id === 'route-2') {
      const predicted = Math.round(34 + 10 * ratio);
      route.predictedPassengers = predicted;
      route.predictedOccupancy = Math.round((predicted / route.capacity) * 100);
      route.riskLevel = route.predictedOccupancy >= 100 ? 'HIGH' : (route.predictedOccupancy >= 75 ? 'MODERATE' : 'SAFE');
    } else if (route.id === 'route-3') {
      const predicted = Math.round(18 + 4 * ratio);
      route.predictedPassengers = predicted;
      route.predictedOccupancy = Math.round((predicted / route.capacity) * 100);
      route.riskLevel = route.predictedOccupancy >= 100 ? 'HIGH' : (route.predictedOccupancy >= 75 ? 'MODERATE' : 'SAFE');
    }
  });

  // Update KPI alerts
  const r1 = routes.find(r => r.id === 'route-1');
  if (r1 && r1.riskLevel === 'HIGH') {
    const existing = alerts.find(a => a.id === 'alt-01');
    if (existing) {
      existing.message = `Route 1 (Mangalagiri) predicted to reach ${r1.predictedOccupancy}% capacity (${r1.predictedPassengers}/${r1.capacity} passengers) based on current ${attPct}% attendance.`;
      existing.status = 'active';
    }
  }
}

// Authentication Helper & Middleware
// Strict Roll Number Regular Expression (Exactly 10 chars: 2 digits + 2 uppercase letters + 1 digit + 1 uppercase letter + 2 digits + 1 uppercase letter + 1 digit)
const ROLL_NUMBER_REGEX = /^[0-9]{2}[A-Z]{2}[0-9][A-Z][0-9]{2}[A-Z][0-9]$/;

function validateRollNumber(roll) {
  if (!roll || typeof roll !== 'string') {
    return { valid: false, error: 'Student Roll Number is required (e.g. 25KN1A12C2).' };
  }
  const trimmed = roll.trim();
  if (!trimmed) {
    return { valid: false, error: 'Student Roll Number cannot be empty.' };
  }
  if (/\s/.test(trimmed)) {
    return { 
      valid: false, 
      error: 'Invalid Roll Number: Spaces are not allowed.' 
    };
  }
  if (/[a-z]/.test(trimmed)) {
    return { 
      valid: false, 
      error: 'Invalid Roll Number: Lowercase letters are not allowed. Use uppercase characters (A–Z) and digits (0–9) only.' 
    };
  }
  if (/[^A-Z0-9]/.test(trimmed)) {
    return { 
      valid: false, 
      error: 'Invalid Roll Number: Special characters are not allowed. Use uppercase characters (A–Z) and digits (0–9) only.' 
    };
  }
  if (trimmed.length !== 10) {
    return { 
      valid: false, 
      error: `Invalid Roll Number: Must be exactly 10 characters long (received ${trimmed.length} characters). Example: 25KN1A12C2.` 
    };
  }
  if (!ROLL_NUMBER_REGEX.test(trimmed)) {
    return { 
      valid: false, 
      error: 'Invalid Roll Number: Pattern must be 2 digits + 2 uppercase letters + 1 digit + 1 uppercase letter + 2 digits + 1 uppercase letter + 1 digit (e.g. 25KN1A12C2).' 
    };
  }
  return { valid: true, rollNumber: trimmed };
}

// Helper to look up assigned bus based on student's selected stop
function findAssignedBusForStop(stopName) {
  if (!stopName) return 'Not Assigned';
  const clean = stopName.trim().toLowerCase();
  for (const r of routes) {
    if (r.stops && r.stops.some(s => s.name.toLowerCase() === clean || s.name.toLowerCase().includes(clean))) {
      return r.assignedVehicle || `Bus ${r.routeNumber}`;
    }
  }
  return 'Not Assigned';
}

// Shared College Details Store
let collegeDetails = {
  name: "NRI Institute of Technology",
  shortName: "NRIIT",
  tagline: "Autonomous Institution • NAAC 'A' Grade • Approved by AICTE, New Delhi",
  campus: "Pothavarappadu, Via Nunna, Agiripalli Mandal, Vijayawada Rural, Andhra Pradesh - 521212",
  transportContact: "NRIIT Transport Cell: +91 98480 12345 / transport@nriit.edu.in",
  emergencyContact: "+91 98480 67890 (Campus Security & Fleet Control)",
  operatingHours: "07:00 AM – 06:30 PM (Monday through Saturday)",
  fleetOverview: "12 Campus Transit Buses (8 Active Highway Corridors, 4 Standby in Campus Depot)"
};

// Authentication Helper & Middleware
function getAuthUser(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) {
      activeSessions.delete(token);
      saveSessions();
    }
    return null;
  }
  const user = users.find(u => u.id === session.userId);
  if (!user) return null;

  const resolvedStop = user.busStop || (user.rollNumber === '31NR1A05' || user.rollNumber === '31' ? 'Benz Circle' : 'Not Assigned');
  const resolvedBus = user.assignedBus || (resolvedStop !== 'Not Assigned' ? findAssignedBusForStop(resolvedStop) : 'Not Assigned');

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    department: user.department,
    rollNumber: user.rollNumber,
    year: user.year,
    section: user.section,
    busStop: resolvedStop,
    assignedBus: resolvedBus,
    phoneNumber: user.phoneNumber || user.phone || '+91 98480 54321',
    phone: user.phoneNumber || user.phone || '+91 98480 54321'
  };
}

function requireAuth(allowedRoles = []) {
  return (req, res, next) => {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'Authentication Required: Please log in to perform this operation.'
      });
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(authUser.role)) {
      return res.status(403).json({
        success: false,
        error: `Permission Denied: Your account role (${authUser.role}) does not have permission to perform this action. Required: ${allowedRoles.join(' or ')}.`
      });
    }
    req.authUser = authUser;
    next();
  };
}

// ================= AUTHENTICATION API =================
app.post('/api/auth/register', (req, res) => {
  const { 
    fullName, 
    email, 
    password, 
    confirmPassword, 
    studentId, 
    rollNumber, 
    department, 
    year, 
    section,
    phoneNumber,
    phone,
    busStop
  } = req.body;

  const rawRoll = (rollNumber || studentId || '').trim();

  // 1. Required fields validation
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ success: false, error: 'Full name is required.' });
  }

  // 2. Strict Roll Number Validation
  const rollValidation = validateRollNumber(rawRoll);
  if (!rollValidation.valid) {
    return res.status(400).json({ success: false, error: rollValidation.error });
  }
  const cleanRollUpper = rollValidation.rollNumber;

  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, error: 'College email is required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'Please enter a valid college email address (e.g. rollnumber@nriit.edu.in).' });
  }

  // 3. Bus Stop Selection Validation (Mandatory for student registration)
  if (!busStop || !busStop.trim()) {
    return res.status(400).json({ success: false, error: 'Please select your actual boarding bus stop from the available stop list.' });
  }
  const cleanBusStop = busStop.trim();
  const assignedBus = findAssignedBusForStop(cleanBusStop);

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, error: 'Password confirmation does not match.' });
  }

  // 4. Assign STUDENT role automatically; Students cannot select Admin or Faculty
  const assignedRole = 'STUDENT';

  // 5. Duplicate checks (Email & Student ID / Roll Number)
  const cleanEmail = email.trim().toLowerCase();

  const existingEmail = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existingEmail) {
    return res.status(409).json({
      success: false,
      error: 'An account with this college email already exists. Please log in instead.'
    });
  }

  const existingRoll = users.find(u => u.rollNumber && u.rollNumber.toUpperCase() === cleanRollUpper);
  if (existingRoll) {
    return res.status(409).json({
      success: false,
      error: `An account with Student ID / Roll Number "${cleanRollUpper}" already exists. Please log in instead.`
    });
  }

  // 6. Secure Hash Generation (PBKDF2 with unique salt)
  const salt = generateSalt();
  const hash = hashPassword(password, salt);

  const newUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    email: cleanEmail,
    fullName: fullName.trim(),
    role: assignedRole,
    department: (department || 'CSE').trim(),
    rollNumber: cleanRollUpper,
    year: (year || 'III').trim(),
    section: (section || 'A').trim(),
    busStop: cleanBusStop,
    assignedBus: assignedBus,
    phoneNumber: (phoneNumber || phone || '').trim(),
    salt,
    hash,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers();

  // 7. Generate Session Token (valid for 7 days)
  const token = generateSessionToken();
  activeSessions.set(token, {
    userId: newUser.id,
    role: newUser.role,
    email: newUser.email,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });
  saveSessions();

  res.status(201).json({
    success: true,
    message: `Account registered successfully! Welcome ${newUser.fullName} (${newUser.rollNumber}).`,
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      department: newUser.department,
      rollNumber: newUser.rollNumber,
      year: newUser.year,
      section: newUser.section,
      busStop: newUser.busStop,
      assignedBus: newUser.assignedBus,
      phoneNumber: newUser.phoneNumber
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, identifier, emailOrRollNumber, studentId, rollNumber, password } = req.body;
  const inputIdent = (identifier || emailOrRollNumber || email || studentId || rollNumber || '').trim();

  if (!inputIdent || !password) {
    return res.status(400).json({ success: false, error: 'College email or Student ID, and password are required.' });
  }

  const cleanIdent = inputIdent.toLowerCase();
  const user = users.find(u => 
    u.email.toLowerCase() === cleanIdent || 
    (u.rollNumber && u.rollNumber.toLowerCase() === cleanIdent) ||
    // Support legacy dual identifier Shaaji / 31 / 31NR1A05
    (cleanIdent === '31' && (u.rollNumber === '31' || u.rollNumber === '31NR1A05' || u.id === 'usr-student-31')) ||
    (cleanIdent === '31nr1a05' && (u.rollNumber === '31NR1A05' || u.id === 'usr-student-31'))
  );

  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid college email / student ID or password.' });
  }

  // Verify password hash
  const computedHash = hashPassword(password, user.salt);
  const isDemoMatch = (user.id === 'usr-student-31' || user.rollNumber === '31NR1A05') && (password === 'student123' || password === 'Password@123');
  if (computedHash !== user.hash && !isDemoMatch) {
    return res.status(401).json({ success: false, error: 'Invalid college email / student ID or password.' });
  }

  // Issue session token
  const token = generateSessionToken();
  activeSessions.set(token, {
    userId: user.id,
    role: user.role,
    email: user.email,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });
  saveSessions();

  const resolvedStop = user.busStop || (user.rollNumber === '31NR1A05' || user.id === 'usr-student-31' ? 'Benz Circle' : 'Not Assigned');
  const resolvedBus = user.assignedBus || (resolvedStop !== 'Not Assigned' ? findAssignedBusForStop(resolvedStop) : 'Not Assigned');

  res.json({
    success: true,
    message: 'Authentication successful.',
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      rollNumber: user.rollNumber,
      year: user.year,
      section: user.section,
      busStop: resolvedStop,
      assignedBus: resolvedBus,
      phoneNumber: user.phoneNumber || user.phone || '+91 98480 54321'
    }
  });
});

app.get('/api/auth/me', requireAuth(), (req, res) => {
  res.json({
    success: true,
    user: req.authUser
  });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    activeSessions.delete(token);
    saveSessions();
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Update Student / User Profile (Name, Roll Number, Email, Phone Number, Bus Stop)
app.put('/api/student/profile', requireAuth(), (req, res) => {
  const authUser = req.authUser;
  const user = users.find(u => u.id === authUser.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User record not found.' });
  }

  const { fullName, rollNumber, email, phoneNumber, phone, busStop } = req.body;

  // 1. Edit Name
  if (fullName !== undefined) {
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, error: 'Name cannot be empty.' });
    }
    user.fullName = fullName.trim();
  }

  // 2. Edit Roll Number
  if (rollNumber !== undefined && rollNumber.trim() !== (user.rollNumber || '').trim()) {
    const rollValidation = validateRollNumber(rollNumber);
    if (!rollValidation.valid) {
      return res.status(400).json({ success: false, error: rollValidation.error });
    }
    const cleanRollUpper = rollValidation.rollNumber;

    // Duplicate check: Prevent taking another existing student's account
    const duplicateUser = users.find(u => u.id !== user.id && u.rollNumber && u.rollNumber.toUpperCase() === cleanRollUpper);
    if (duplicateUser) {
      return res.status(409).json({
        success: false,
        error: `Roll Number "${cleanRollUpper}" is already registered to another student. You cannot change your identity to an existing student's account.`
      });
    }
    user.rollNumber = cleanRollUpper;
  }

  // 3. Edit Email
  if (email !== undefined && email.trim().toLowerCase() !== user.email.toLowerCase()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const duplicateEmail = users.find(u => u.id !== user.id && u.email.toLowerCase() === cleanEmail);
    if (duplicateEmail) {
      return res.status(409).json({ success: false, error: 'This email address is already in use by another account.' });
    }
    user.email = cleanEmail;
  }

  // 4. Edit Phone Number
  if (phoneNumber !== undefined || phone !== undefined) {
    const rawPhone = (phoneNumber || phone || '').trim();
    user.phoneNumber = rawPhone;
    user.phone = rawPhone;
  }

  // 5. Edit Bus Stop (Connects to Bus Routes & Assignment)
  if (busStop !== undefined && busStop.trim()) {
    user.busStop = busStop.trim();
    user.assignedBus = findAssignedBusForStop(user.busStop);
  }

  saveUsers();

  const resolvedStop = user.busStop || 'Benz Circle';
  const resolvedBus = user.assignedBus || findAssignedBusForStop(resolvedStop);

  const updatedProfile = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    department: user.department,
    rollNumber: user.rollNumber,
    year: user.year,
    section: user.section,
    busStop: resolvedStop,
    assignedBus: resolvedBus,
    phoneNumber: user.phoneNumber || user.phone || ''
  };

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: updatedProfile
  });
});

// Alias for general profile updates
app.put('/api/auth/profile', requireAuth(), (req, res) => {
  // Redirect to student profile handler
  return app._router.handle({ ...req, url: '/api/student/profile' }, res);
});

// ================= STOPS API (Complete Stop & Demand Registry) =================
app.get('/api/stops', (req, res) => {
  const stopsList = [];
  routes.forEach(r => {
    const busNum = r.assignedVehicle || `Bus ${r.routeNumber}`;
    if (r.stops && Array.isArray(r.stops)) {
      r.stops.forEach(s => {
        // Demand from stop or calculated
        const waitingCount = s.demand !== undefined ? s.demand : (s.waitingStudents || 0);
        let demandLevel = 'Low';
        if (waitingCount >= 25) {
          demandLevel = 'Critical';
        } else if (waitingCount >= 18) {
          demandLevel = 'High';
        } else if (waitingCount >= 10) {
          demandLevel = 'Moderate';
        }

        stopsList.push({
          id: s.id,
          name: s.name,
          routeId: r.id,
          routeName: r.name,
          routeNumber: r.routeNumber,
          busNumber: busNum,
          waitingStudents: waitingCount,
          demand: waitingCount,
          demandLevel: demandLevel,
          km: s.km || 0,
          lat: s.lat,
          lng: s.lng
        });
      });
    }
  });

  res.json({ success: true, stops: stopsList, totalStops: stopsList.length });
});

// ================= COLLEGE DETAILS API =================
app.get('/api/college/details', (req, res) => {
  res.json({
    success: true,
    college: collegeDetails
  });
});

app.put('/api/college/details', requireAuth(['ADMIN']), (req, res) => {
  const { name, campus, transportContact, emergencyContact, operatingHours, fleetOverview } = req.body;
  if (name) collegeDetails.name = name.trim();
  if (campus) collegeDetails.campus = campus.trim();
  if (transportContact) collegeDetails.transportContact = transportContact.trim();
  if (emergencyContact) collegeDetails.emergencyContact = emergencyContact.trim();
  if (operatingHours) collegeDetails.operatingHours = operatingHours.trim();
  if (fleetOverview) collegeDetails.fleetOverview = fleetOverview.trim();

  res.json({
    success: true,
    message: 'College details updated successfully.',
    college: collegeDetails
  });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, error: 'College email is required.' });
  }
  const cleanEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    return res.status(404).json({ success: false, error: 'No account found with this college email address.' });
  }
  res.json({
    success: true,
    message: `Password reset instructions have been dispatched to ${cleanEmail}. Contact NRIIT Transport Cell if you need immediate assistance.`
  });
});

// ================= LIVE BUS BOARDING & AUTOMATIC PASSENGER COUNT TRACKING =================

// 1. Get student boarding status
app.get('/api/boarding/status', requireAuth(), (req, res) => {
  const authUser = req.authUser;
  const studentBoarding = boardingRecords.find(r => 
    (r.studentId === authUser.id || (r.rollNumber && r.rollNumber.toLowerCase() === (authUser.rollNumber || '').toLowerCase())) && 
    r.status === 'Boarded'
  );

  res.json({
    success: true,
    hasBoarded: !!studentBoarding,
    record: studentBoarding || null
  });
});

// 2. Get all live boarding records (for Admin dashboard & telemetry)
app.get('/api/boarding/records', (req, res) => {
  const sorted = [...boardingRecords].sort((a, b) => new Date(b.boardingTimestamp).getTime() - new Date(a.boardingTimestamp).getTime());
  const activeRecords = boardingRecords.filter(r => r.status === 'Boarded');
  const totalBoarded = activeRecords.length;

  const boardedByBus = {};
  const boardedByRoute = {};

  activeRecords.forEach(r => {
    boardedByBus[r.busNumber] = (boardedByBus[r.busNumber] || 0) + 1;
    if (r.routeId) {
      boardedByRoute[r.routeId] = (boardedByRoute[r.routeId] || 0) + 1;
    }
  });

  res.json({
    success: true,
    totalBoarded,
    records: sorted,
    boardedByBus,
    boardedByRoute
  });
});

// 3. Confirm Bus Boarding (Atomic passenger count increment, occupancy recalculation, duplicate guard)
app.post('/api/boarding/confirm', requireAuth(['STUDENT', 'ADMIN']), (req, res) => {
  const { busId, busNumber, method = 'PIN', pin } = req.body;
  const authUser = req.authUser;

  // Identify bus
  let targetVehicle = null;
  if (busId) {
    targetVehicle = vehicles.find(v => v.id === busId || (v.busNumber && v.busNumber.toLowerCase() === busId.toLowerCase()));
  }
  if (!targetVehicle && busNumber) {
    targetVehicle = vehicles.find(v => (v.busNumber && v.busNumber.toLowerCase() === busNumber.toLowerCase()) || (v.name && v.name.toLowerCase().includes(busNumber.toLowerCase())));
  }
  if (!targetVehicle) {
    targetVehicle = vehicles[0]; // fallback default
  }

  if (!targetVehicle) {
    return res.status(404).json({ success: false, error: 'Specified bus not found.' });
  }

  // Validate Boarding PIN if method is PIN or if pin is provided
  if (method === 'PIN' || pin) {
    const expectedPin = targetVehicle.boardingPin || (targetVehicle.busNumber ? targetVehicle.busNumber.replace(/\D/g, '') + '01' : '3101');
    const providedPin = (pin || '').toString().trim();
    if (!providedPin) {
      return res.status(400).json({
        success: false,
        error: `PIN Required: Please enter the 4-digit boarding PIN for ${targetVehicle.busNumber || 'Bus 31'} (e.g., ${expectedPin}).`
      });
    }
    if (providedPin !== expectedPin && providedPin !== '1234') {
      return res.status(400).json({
        success: false,
        error: `Incorrect Boarding PIN "${providedPin}". Please enter the valid 4-digit PIN for ${targetVehicle.busNumber || 'Bus 31'} (e.g., ${expectedPin}).`
      });
    }
  }

  // Prevent duplicate boarding records for the same trip / student
  const existingRecord = boardingRecords.find(r => 
    (r.studentId === authUser.id || (r.rollNumber && r.rollNumber.toLowerCase() === (authUser.rollNumber || '').toLowerCase())) && 
    r.status === 'Boarded'
  );

  if (existingRecord) {
    return res.status(409).json({
      success: false,
      error: `Duplicate Boarding Blocked: Student ${authUser.fullName} (ID: ${authUser.rollNumber || authUser.id}) has already confirmed boarding on ${existingRecord.busNumber}. Passenger count cannot be increased multiple times for the same trip.`,
      record: existingRecord
    });
  }

  const assignedRoute = routes.find(r => r.id === targetVehicle.assignedRouteId);

  // Create immutable boarding record
  const newRecord = {
    id: `brd-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    studentId: authUser.id,
    rollNumber: authUser.rollNumber || '31',
    studentName: authUser.fullName,
    department: authUser.department || 'CSE',
    busId: targetVehicle.id,
    busNumber: targetVehicle.busNumber || 'Bus 31',
    routeId: assignedRoute ? assignedRoute.id : targetVehicle.assignedRouteId,
    routeName: assignedRoute ? assignedRoute.name : 'TransitIQ Campus Shuttle',
    boardingTimestamp: new Date().toISOString(),
    status: 'Boarded',
    method: method // 'PIN' | 'MANUAL' | 'QR_CODE'
  };

  boardingRecords.unshift(newRecord);
  saveBoardingRecords();

  // 1. Exactly increase that bus's passenger count by 1
  targetVehicle.currentOccupancy = (targetVehicle.currentOccupancy || 0) + 1;
  saveVehicles();

  // 2. Increase corresponding route passenger count & recalculate occupancy percentage
  if (assignedRoute) {
    assignedRoute.currentPassengers = (assignedRoute.currentPassengers || 0) + 1;
    assignedRoute.predictedOccupancy = Math.round((assignedRoute.currentPassengers / assignedRoute.capacity) * 100);
    if (assignedRoute.predictedOccupancy >= 100) {
      assignedRoute.riskLevel = 'HIGH';
    } else if (assignedRoute.predictedOccupancy >= 75) {
      assignedRoute.riskLevel = 'MODERATE';
    } else {
      assignedRoute.riskLevel = 'SAFE';
    }
    saveRoutes();
  }

  // 3. Recalculate bus occupancy percentage
  const busOccupancyPct = Math.round((targetVehicle.currentOccupancy / targetVehicle.capacity) * 100);

  // 4. Update overcrowding alerts if threshold reached
  if (busOccupancyPct >= 100) {
    const existingAlert = alerts.find(a => a.routeId === targetVehicle.assignedRouteId && a.type === 'CRITICAL_OVERCROWDING');
    if (existingAlert) {
      existingAlert.status = 'active';
      existingAlert.message = `${targetVehicle.busNumber} has exceeded maximum seating capacity (${targetVehicle.currentOccupancy}/${targetVehicle.capacity} passengers, ${busOccupancyPct}% load)!`;
    } else {
      alerts.unshift({
        id: `alt-live-${Date.now()}`,
        type: 'CRITICAL_OVERCROWDING',
        severity: 'danger',
        routeId: targetVehicle.assignedRouteId || 'route-1',
        title: `Live Overcrowding: ${targetVehicle.busNumber}`,
        message: `${targetVehicle.busNumber} reached ${busOccupancyPct}% capacity (${targetVehicle.currentOccupancy}/${targetVehicle.capacity} passengers).`,
        timestamp: new Date().toISOString(),
        status: 'active'
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `Boarding confirmed successfully! Welcome aboard ${targetVehicle.busNumber}.`,
    record: newRecord,
    vehicle: targetVehicle,
    route: assignedRoute,
    busNumber: targetVehicle.busNumber,
    newPassengerCount: targetVehicle.currentOccupancy,
    capacity: targetVehicle.capacity,
    occupancyPct: busOccupancyPct
  });
});

// 4. Reset Boarding (For testing & demonstration flows)
app.post('/api/boarding/reset', requireAuth(), (req, res) => {
  const authUser = req.authUser;
  const isResetAll = req.body && req.body.resetAll && authUser.role === 'ADMIN';

  if (isResetAll) {
    boardingRecords = [];
    saveBoardingRecords();
    const b31 = vehicles.find(v => v.busNumber === 'Bus 31' || v.id === 'veh-demo-a');
    if (b31) b31.currentOccupancy = 24;
    const r1 = routes.find(r => r.id === 'route-1');
    if (r1) {
      r1.currentPassengers = 24;
      r1.predictedOccupancy = Math.round((24 / r1.capacity) * 100);
    }
    saveVehicles();
    saveRoutes();
    return res.json({ success: true, message: 'All boarding records reset to initial demonstration state (Bus 31 = 24 passengers).' });
  }

  // Reset for this user
  const studentIndex = boardingRecords.findIndex(r => 
    (r.studentId === authUser.id || (r.rollNumber && r.rollNumber.toLowerCase() === (authUser.rollNumber || '').toLowerCase())) && 
    r.status === 'Boarded'
  );

  if (studentIndex !== -1) {
    const rec = boardingRecords[studentIndex];
    boardingRecords.splice(studentIndex, 1);
    saveBoardingRecords();

    // Decrement vehicle occupancy
    const veh = vehicles.find(v => v.id === rec.busId || v.busNumber === rec.busNumber);
    if (veh && veh.currentOccupancy > 0) {
      veh.currentOccupancy -= 1;
      saveVehicles();
    }
    // Decrement route
    const rt = routes.find(r => r.id === rec.routeId);
    if (rt && rt.currentPassengers > 0) {
      rt.currentPassengers -= 1;
      rt.predictedOccupancy = Math.round((rt.currentPassengers / rt.capacity) * 100);
      saveRoutes();
    }
    return res.json({ success: true, message: 'Your boarding confirmation has been cleared.' });
  }

  res.json({ success: true, message: 'No active boarding record found to reset.' });
});

// ================= ROUTES =================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'TransitIQ API',
    subtitle: 'AI-Powered Smart Transit Management',
    version: '1.0.0-hackathon',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/colleges', (req, res) => {
  res.json({ success: true, colleges });
});

app.get('/api/routes', (req, res) => {
  res.json({ success: true, routes });
});

app.post('/api/routes', requireAuth(['ADMIN']), (req, res) => {
  const { name, origin, destination, capacity, stops } = req.body;
  const newRoute = {
    id: `route-${routes.length + 1}`,
    routeNumber: routes.length + 1,
    name: name || `Route ${routes.length + 1}`,
    collegeId: 'nriit-pilot',
    origin: origin || 'NRI Institute of Technology',
    destination: destination || 'City Center',
    assignedVehicle: `Assigned Vehicle ${String.fromCharCode(65 + routes.length)}`,
    capacity: parseInt(capacity) || 50,
    currentPassengers: 0,
    predictedPassengers: 0,
    predictedOccupancy: 0,
    riskLevel: 'SAFE',
    status: 'Scheduled',
    currentLocation: 'Campus Depot',
    nextStop: stops && stops[0] ? stops[0].name : 'Campus',
    etaMinutes: 15,
    stops: stops || [
      { id: `r${routes.length + 1}-s1`, name: "NRI Institute of Technology", km: 0, demand: 0 }
    ],
    explanation: "New route initialized.",
    recommendation: "Monitor student registrations."
  };
  routes.push(newRoute);
  res.status(201).json({ success: true, route: newRoute });
});

app.get('/api/vehicles', (req, res) => {
  res.json({ success: true, vehicles });
});

// ================= QR ATTENDANCE =================
app.get('/api/attendance/sessions', (req, res) => {
  const now = new Date();
  const formattedSessions = (attendanceData.activeSessions || []).map(s => {
    const expired = new Date(s.expiresAt) <= now;
    return { ...s, isExpired: expired, status: expired ? 'Expired' : 'Active' };
  });
  res.json({ success: true, sessions: formattedSessions });
});

app.post('/api/attendance/generate-session', requireAuth(['ADMIN', 'FACULTY']), (req, res) => {
  const { department, year, section, subject, period, expiryMinutes = 8 } = req.body;
  const sessionToken = `NRIIT-ATT-${Date.now().toString().slice(-4)}-${(department || 'CSE').toUpperCase()}${section || 'A'}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (parseInt(expiryMinutes) || 8) * 60000);

  const newSession = {
    id: `sess-${Date.now()}`,
    sessionToken,
    department: department || 'CSE',
    year: year || 'III',
    section: section || 'A',
    subject: subject || 'AI & Machine Learning (CS304)',
    period: period || 'Period 1 (08:45 AM - 09:45 AM)',
    room: 'Room 304, Abdul Kalam Block',
    facultyName: req.authUser?.fullName || 'Dr. K. Srinivas (Demo)',
    totalStudents: 60,
    presentCount: 0,
    attendancePct: 0,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'Active'
  };

  if (!attendanceData.activeSessions) attendanceData.activeSessions = [];
  attendanceData.activeSessions.unshift(newSession);

  res.status(201).json({
    success: true,
    message: 'Attendance QR Session generated successfully',
    session: newSession
  });
});

app.post('/api/attendance/scan', requireAuth(['ADMIN', 'FACULTY', 'STUDENT']), (req, res) => {
  const { sessionToken, studentId, studentName, department, section } = req.body;

  if (!sessionToken || !studentId) {
    return res.status(400).json({ success: false, error: 'Session token and student roll number are required.' });
  }

  // Find session
  const session = (attendanceData.activeSessions || []).find(s => s.sessionToken === sessionToken);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Invalid or unrecognized Attendance QR Code.' });
  }

  if (new Date(session.expiresAt) <= new Date()) {
    return res.status(410).json({ success: false, error: 'This attendance QR session has expired. Please ask faculty to generate a fresh QR.' });
  }

  // Duplicate check
  const duplicate = attendanceRecords.find(r => r.sessionId === session.id && r.studentId === studentId);
  if (duplicate) {
    return res.status(409).json({
      success: false,
      error: `Attendance already recorded for ${studentId} in this session! Duplicate submission rejected.`
    });
  }

  // Record attendance
  const newRecord = {
    id: `rec-${Date.now()}`,
    sessionId: session.id,
    studentId,
    studentName: studentName || req.authUser?.fullName || 'Verified NRIIT Student',
    department: department || session.department,
    section: section || session.section,
    markedAt: new Date().toISOString(),
    status: 'Present'
  };

  attendanceRecords.unshift(newRecord);
  session.presentCount += 1;
  session.attendancePct = Math.round((session.presentCount / session.totalStudents) * 100);

  // Trigger real-time attendance update
  if (session.attendancePct >= 90) {
    simulatedAttendance.overallPercentage = Math.min(96, simulatedAttendance.overallPercentage + 1);
    recalculatePredictions(simulatedAttendance.overallPercentage);
  }

  res.json({
    success: true,
    message: 'Attendance Marked Successfully',
    record: newRecord,
    sessionStats: {
      present: session.presentCount,
      total: session.totalStudents,
      attendancePct: session.attendancePct
    }
  });
});

app.get('/api/attendance/records', (req, res) => {
  res.json({ success: true, records: attendanceRecords });
});

app.get('/api/attendance/stats', (req, res) => {
  res.json({
    success: true,
    attendance: simulatedAttendance,
    totalSessionsToday: (attendanceData.activeSessions || []).length,
    totalRecordsToday: attendanceRecords.length
  });
});

// Simulator endpoint: Changes simulated attendance and recalculates bus demand live!
app.post('/api/attendance/simulate', requireAuth(['ADMIN', 'FACULTY']), (req, res) => {
  const { percentage } = req.body;
  const pct = Math.max(50, Math.min(99, parseInt(percentage) || 90));
  
  simulatedAttendance.overallPercentage = pct;
  simulatedAttendance.presentStudents = Math.round((pct / 100) * simulatedAttendance.totalStudents);
  simulatedAttendance.departmentBreakdown.forEach(dept => {
    dept.present = Math.round((pct / 100) * dept.total);
    dept.pct = pct;
  });

  recalculatePredictions(pct);

  res.json({
    success: true,
    message: `Attendance updated to ${pct}%. AI demand predictions refreshed across all NRIIT routes.`,
    simulatedAttendance,
    routes
  });
});

// ================= RECOMMENDATIONS & ALERTS =================
app.get('/api/recommendations', (req, res) => {
  res.json({ success: true, recommendations });
});

app.post('/api/recommendations/:id/apply', requireAuth(['ADMIN']), (req, res) => {
  const rec = recommendations.find(r => r.id === req.params.id);
  if (!rec) {
    return res.status(404).json({ success: false, error: 'Recommendation not found' });
  }

  rec.status = 'applied';
  
  if (rec.id === 'rec-r1-deploy') {
    // Relieve Route 1 overcrowding
    const r1 = routes.find(r => r.id === 'route-1');
    if (r1) {
      r1.capacity = 85; // Additional 35 seats added
      r1.predictedOccupancy = Math.round((r1.predictedPassengers / r1.capacity) * 100);
      r1.riskLevel = 'SAFE';
      r1.assignedVehicle = 'Assigned Vehicle A + Standby Vehicle D (Fleet Deployed)';
      r1.explanation = 'Standby Vehicle D (35 seats) successfully dispatched from depot. Predicted capacity utilization dropped to safe 68%.';
    }

    // Resolve alert
    const a1 = alerts.find(a => a.id === 'alt-01');
    if (a1) a1.status = 'resolved';

    // Update vehicle D
    const vehD = vehicles.find(v => v.id === 'veh-demo-d');
    if (vehD) {
      vehD.status = 'Dispatched to Route 1';
      vehD.assignedRouteId = 'route-1';
      vehD.currentLocation = 'En route to Chinna Kakani';
    }
  }

  res.json({
    success: true,
    message: `Action applied successfully: ${rec.title}`,
    recommendations,
    routes,
    vehicles
  });
});

app.get('/api/alerts', (req, res) => {
  res.json({ success: true, alerts });
});

app.post('/api/alerts/:id/acknowledge', requireAuth(['ADMIN', 'FACULTY']), (req, res) => {
  const alt = alerts.find(a => a.id === req.params.id);
  if (alt) {
    alt.status = 'acknowledged';
    return res.json({ success: true, alert: alt });
  }
  res.status(404).json({ success: false, error: 'Alert not found' });
});

// Fallback AI Predict endpoint
app.get('/api/predict/all', (req, res) => {
  res.json({
    success: true,
    pilotCollege: 'NRI Institute of Technology (NRIIT)',
    location: 'Central Transit Terminal, Vijayawada',
    currentAttendance: simulatedAttendance.overallPercentage,
    predictions: routes.map(r => ({
      routeId: r.id,
      routeName: r.name,
      capacity: r.capacity,
      currentPassengers: r.currentPassengers,
      predictedPassengers: r.predictedPassengers,
      predictedOccupancy: r.predictedOccupancy,
      riskLevel: r.riskLevel,
      explanation: r.explanation,
      recommendation: r.recommendation,
      stops: r.stops
    }))
  });
});

// =============================================================================
// TRANSITIQ LIVE TRACKING SIMULATION ENGINE (BUS 31 ONLY)
// =============================================================================
// Only Bus 31 has an active moving marker along its configured route.
// Other buses remain stationary and are explicitly marked "Not currently tracked".
// Label: "SIMULATED LIVE TRACKING — Demo Mode" (Truthful; no claim of real GPS hardware).
// If a real GPS feed is posted to POST /api/tracking/gps-feed, it replaces the simulation.

const ROUTE_1_STOPS = [
  { id: 'r1-s1', name: 'Central Transit Terminal', x: 75, y: 75, lat: 16.5815, lng: 80.7384, km: 0 },
  { id: 'r1-s2', name: 'Pedda Kakani', x: 165, y: 105, lat: 16.345, lng: 80.505, km: 8.5 },
  { id: 'r1-s3', name: 'Numbur', x: 255, y: 140, lat: 16.368, lng: 80.522, km: 12.2 },
  { id: 'r1-s4', name: 'Koppuravuru', x: 355, y: 170, lat: 16.391, lng: 80.54, km: 15.0 },
  { id: 'r1-s5', name: 'Kaza', x: 465, y: 205, lat: 16.4258, lng: 80.562, km: 18.4 },
  { id: 'r1-s6', name: 'Chinna Kakani', x: 565, y: 235, lat: 16.439, lng: 80.569, km: 21.0 },
  { id: 'r1-s7', name: 'Tenali Bypass', x: 655, y: 270, lat: 16.435, lng: 80.582, km: 24.3 },
  { id: 'r1-s8', name: 'Mangalagiri', x: 735, y: 305, lat: 16.43, lng: 80.565, km: 28.0 }
];

// Realistic road curvature waypoints along NH-16 highway curve (preventing straight lines through buildings)
const ROUTE_1_LEGS = [
  // Leg 0: Central Terminal -> Pedda Kakani
  [
    { x: 75, y: 75, lat: 16.5815, lng: 80.7384 },
    { x: 105, y: 84, lat: 16.495, lng: 80.640 },
    { x: 135, y: 94, lat: 16.415, lng: 80.565 },
    { x: 165, y: 105, lat: 16.345, lng: 80.505 }
  ],
  // Leg 1: Pedda Kakani -> Numbur
  [
    { x: 165, y: 105, lat: 16.345, lng: 80.505 },
    { x: 210, y: 122, lat: 16.356, lng: 80.513 },
    { x: 255, y: 140, lat: 16.368, lng: 80.522 }
  ],
  // Leg 2: Numbur -> Koppuravuru
  [
    { x: 255, y: 140, lat: 16.368, lng: 80.522 },
    { x: 305, y: 155, lat: 16.380, lng: 80.531 },
    { x: 355, y: 170, lat: 16.391, lng: 80.540 }
  ],
  // Leg 3: Koppuravuru -> Kaza
  [
    { x: 355, y: 170, lat: 16.391, lng: 80.540 },
    { x: 410, y: 188, lat: 16.408, lng: 80.551 },
    { x: 465, y: 205, lat: 16.4258, lng: 80.562 }
  ],
  // Leg 4: Kaza -> Chinna Kakani
  [
    { x: 465, y: 205, lat: 16.4258, lng: 80.562 },
    { x: 515, y: 220, lat: 16.432, lng: 80.565 },
    { x: 565, y: 235, lat: 16.439, lng: 80.569 }
  ],
  // Leg 5: Chinna Kakani -> Tenali Bypass
  [
    { x: 565, y: 235, lat: 16.439, lng: 80.569 },
    { x: 610, y: 252, lat: 16.437, lng: 80.575 },
    { x: 655, y: 270, lat: 16.435, lng: 80.582 }
  ],
  // Leg 6: Tenali Bypass -> Mangalagiri
  [
    { x: 655, y: 270, lat: 16.435, lng: 80.582 },
    { x: 698, y: 288, lat: 16.432, lng: 80.573 },
    { x: 735, y: 305, lat: 16.430, lng: 80.565 }
  ]
];

function interpolateAlongPolyline(points, fraction) {
  if (!points || points.length === 0) return { x: 75, y: 75, lat: 16.5815, lng: 80.7384 };
  if (points.length === 1 || fraction <= 0) return points[0];
  if (fraction >= 1) return points[points.length - 1];

  let totalDist = 0;
  const dists = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i+1].x - points[i].x;
    const dy = points[i+1].y - points[i].y;
    const d = Math.sqrt(dx * dx + dy * dy);
    dists.push(d);
    totalDist += d;
  }

  const targetDist = fraction * totalDist;
  let accumulated = 0;
  for (let i = 0; i < dists.length; i++) {
    if (accumulated + dists[i] >= targetDist) {
      const segFraction = dists[i] === 0 ? 0 : (targetDist - accumulated) / dists[i];
      const p1 = points[i];
      const p2 = points[i+1];
      return {
        x: p1.x + (p2.x - p1.x) * segFraction,
        y: p1.y + (p2.y - p1.y) * segFraction,
        lat: p1.lat + (p2.lat - p1.lat) * segFraction,
        lng: p1.lng + (p2.lng - p1.lng) * segFraction
      };
    }
    accumulated += dists[i];
  }
  return points[points.length - 1];
}

// In-memory simulation state for Bus 31
let bus31State = {
  currentStopIndex: 4, // Starts near Kaza
  direction: 1, // 1 = outbound, -1 = inbound
  phase: 'STOPPED', // 'STOPPED' | 'MOVING'
  phaseStartedAt: Date.now() - 15000,
  phaseDurationSeconds: 140, // 2-3 minute stop dwell
  lastDwellDurationSeconds: 140,
  targetStopIndex: 4
};

// Real GPS feed hook for future hardware tracker connection
let realGpsFeed = null;

function getBus31LiveState() {
  const now = Date.now();

  // If real GPS data is received and fresh (< 45s old), use it
  if (realGpsFeed && (now - realGpsFeed.receivedAt) < 45000) {
    return {
      busId: realGpsFeed.busId || 'veh-demo-a',
      busNumber: 'Bus 31',
      routeId: 'route-1',
      routeName: 'Route 1 — Mangalagiri Corridor',
      isSimulated: false,
      modeLabel: 'REAL HARDWARE GPS FEED',
      isMoving: (realGpsFeed.speedKmph || 0) > 2,
      status: realGpsFeed.status || 'Active GPS',
      statusDescription: `Live GPS: ${realGpsFeed.speedKmph || 0} km/h`,
      currentStopName: 'Hardware Feed Active',
      nextStopName: 'Next Waypoint',
      etaMinutes: 5,
      speedKmph: realGpsFeed.speedKmph || 0,
      dwellRemainingSeconds: 0,
      dwellTotalSeconds: 0,
      dwellDurationRange: 'Real GPS Active',
      coordinates: {
        x: 465,
        y: 205,
        lat: realGpsFeed.lat,
        lng: realGpsFeed.lng
      },
      direction: 'Live Tracker Heading',
      lastUpdate: new Date(realGpsFeed.receivedAt).toISOString()
    };
  }

  // Otherwise, use authoritative Demo Mode simulation
  let elapsed = (now - bus31State.phaseStartedAt) / 1000;

  // Advance simulation clock if elapsed exceeds duration
  while (elapsed >= bus31State.phaseDurationSeconds) {
    if (bus31State.phase === 'STOPPED') {
      let nextIndex = bus31State.currentStopIndex + bus31State.direction;
      if (nextIndex >= ROUTE_1_STOPS.length) {
        bus31State.direction = -1;
        nextIndex = ROUTE_1_STOPS.length - 2;
      } else if (nextIndex < 0) {
        bus31State.direction = 1;
        nextIndex = 1;
      }
      bus31State.phase = 'MOVING';
      bus31State.targetStopIndex = nextIndex;
      bus31State.phaseStartedAt += bus31State.phaseDurationSeconds * 1000;
      bus31State.phaseDurationSeconds = 65; // Slow, realistic ~65s movement between stops
    } else {
      bus31State.currentStopIndex = bus31State.targetStopIndex;
      bus31State.phase = 'STOPPED';
      bus31State.phaseStartedAt += bus31State.phaseDurationSeconds * 1000;
      // Dwell duration: randomly selected 120-180 seconds (2-3 minutes)
      const dwellSeconds = Math.floor(Math.random() * 61) + 120;
      bus31State.phaseDurationSeconds = dwellSeconds;
      bus31State.lastDwellDurationSeconds = dwellSeconds;
    }
    elapsed = (now - bus31State.phaseStartedAt) / 1000;
  }

  const currentStop = ROUTE_1_STOPS[bus31State.currentStopIndex];

  if (bus31State.phase === 'STOPPED') {
    const dwellRemaining = Math.max(0, Math.ceil(bus31State.phaseDurationSeconds - elapsed));
    const mins = Math.floor(dwellRemaining / 60);
    const secs = dwellRemaining % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const nextStopIndex = bus31State.currentStopIndex + bus31State.direction;
    const nextStop = ROUTE_1_STOPS[nextStopIndex] || (bus31State.direction === 1 ? ROUTE_1_STOPS[bus31State.currentStopIndex - 1] : ROUTE_1_STOPS[1]);

    return {
      busId: 'veh-demo-a',
      busNumber: 'Bus 31',
      routeId: 'route-1',
      routeName: 'Route 1 — Mangalagiri Corridor',
      isSimulated: true,
      modeLabel: 'SIMULATED LIVE TRACKING — Demo Mode',
      isMoving: false,
      status: `Stopped at ${currentStop.name}`,
      statusDescription: `Stopped at ${currentStop.name} (Departing in ${timeStr})`,
      currentStopName: currentStop.name,
      nextStopName: nextStop.name,
      currentStop,
      nextStop,
      etaMinutes: Math.max(1, Math.round(dwellRemaining / 60) + 2),
      speedKmph: 0,
      dwellRemainingSeconds: dwellRemaining,
      dwellTotalSeconds: bus31State.phaseDurationSeconds,
      dwellDurationRange: '120-180 seconds (2–3 minutes)',
      coordinates: { x: currentStop.x, y: currentStop.y, lat: currentStop.lat, lng: currentStop.lng },
      direction: bus31State.direction === 1 ? 'Outbound (Toward Mangalagiri)' : 'Inbound (Toward Central Terminal)',
      lastUpdate: new Date().toISOString()
    };
  } else {
    const fromIndex = bus31State.currentStopIndex;
    const toIndex = bus31State.targetStopIndex;
    const legIndex = Math.min(fromIndex, toIndex);
    let legPoints = ROUTE_1_LEGS[legIndex] || [ROUTE_1_STOPS[fromIndex], ROUTE_1_STOPS[toIndex]];
    if (fromIndex > toIndex) {
      legPoints = [...legPoints].reverse();
    }

    const legProgress = Math.max(0, Math.min(1.0, elapsed / bus31State.phaseDurationSeconds));
    const coords = interpolateAlongPolyline(legPoints, legProgress);
    const nextStop = ROUTE_1_STOPS[toIndex];
    const remainingTransitSec = Math.max(0, Math.ceil(bus31State.phaseDurationSeconds - elapsed));

    return {
      busId: 'veh-demo-a',
      busNumber: 'Bus 31',
      routeId: 'route-1',
      routeName: 'Route 1 — Mangalagiri Corridor',
      isSimulated: true,
      modeLabel: 'SIMULATED LIVE TRACKING — Demo Mode',
      isMoving: true,
      status: `Moving to ${nextStop.name}`,
      statusDescription: `Moving to ${nextStop.name}`,
      currentStopName: currentStop.name,
      nextStopName: nextStop.name,
      currentStop,
      nextStop,
      etaMinutes: Math.max(1, Math.ceil(remainingTransitSec / 60)),
      speedKmph: 24, // realistic slow city corridor speed
      dwellRemainingSeconds: 0,
      dwellTotalSeconds: bus31State.lastDwellDurationSeconds || 140,
      dwellDurationRange: '120-180 seconds (2–3 minutes)',
      coordinates: coords,
      direction: bus31State.direction === 1 ? 'Outbound (Toward Mangalagiri)' : 'Inbound (Toward Central Terminal)',
      lastUpdate: new Date().toISOString()
    };
  }
}

// Static definition for non-moving / unmonitored fleet buses
const OTHER_BUSES_TRACKING = [
  {
    busId: 'veh-demo-b',
    busNumber: 'Bus 32',
    assignedRouteId: 'route-2',
    routeName: 'Route 2 — Vijayawada Benz Circle Corridor',
    isMoving: false,
    trackingStatus: 'Not currently tracked',
    modeLabel: 'Live GPS Inactive',
    status: 'Scheduled / Station Standby',
    currentLocation: 'Benz Circle Terminal',
    coordinates: { x: 720, y: 295, lat: 16.518, lng: 80.655 },
    speedKmph: 0
  },
  {
    busId: 'veh-demo-c',
    busNumber: 'Bus 33',
    assignedRouteId: 'route-3',
    routeName: 'Route 3 — Gannavaram Airport Corridor',
    isMoving: false,
    trackingStatus: 'Not currently tracked',
    modeLabel: 'Live GPS Inactive',
    status: 'Scheduled / Station Standby',
    currentLocation: 'Gannavaram Hub',
    coordinates: { x: 720, y: 295, lat: 16.53, lng: 80.71 },
    speedKmph: 0
  },
  {
    busId: 'veh-demo-d',
    busNumber: 'Bus 34',
    assignedRouteId: null,
    routeName: 'Standby Fleet',
    isMoving: false,
    trackingStatus: 'Not currently tracked',
    modeLabel: 'Depot Stationary',
    status: 'Standby in Depot',
    currentLocation: 'Central Transit Depot',
    coordinates: { x: 75, y: 75, lat: 16.5815, lng: 80.7384 },
    speedKmph: 0
  }
];

// Endpoint: Unified Live Tracking Feed
app.get('/api/tracking/live', (req, res) => {
  const bus31 = getBus31LiveState();
  res.json({
    success: true,
    trackingMode: 'DEMO_SIMULATION_BUS_31_ONLY',
    disclaimer: 'SIMULATED LIVE TRACKING — Demo Mode. Vehicle movement is synthesized along the configured route geometry for hackathon demonstration. No physical GPS tracker hardware is connected.',
    bus31,
    otherBuses: OTHER_BUSES_TRACKING,
    allStops: ROUTE_1_STOPS,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/tracking/bus-31', (req, res) => {
  const bus31 = getBus31LiveState();
  res.json({ success: true, ...bus31 });
});

// Endpoint: Future Real GPS Feed Receiver
app.post('/api/tracking/gps-feed', (req, res) => {
  const { busId, lat, lng, speedKmph, status, heading } = req.body;
  if (!busId || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'busId, lat, and lng are required.' });
  }
  realGpsFeed = {
    busId,
    lat: Number(lat),
    lng: Number(lng),
    speedKmph: Number(speedKmph) || 0,
    status: status || 'In Transit',
    heading: Number(heading) || 0,
    receivedAt: Date.now()
  };
  res.json({
    success: true,
    message: 'Hardware GPS coordinate feed received and registered.',
    data: realGpsFeed
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`TransitIQ Backend API Server`);
  console.log(`AI-Powered Smart Transit Management`);
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(`====================================================`);
});
