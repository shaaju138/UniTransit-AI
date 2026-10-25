import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  KeyRound, 
  Loader2, 
  X,
  Phone,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { api } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

// Strict Roll Number Regular Expression (Exactly 10 chars: 2 digits + 2 uppercase letters + 1 digit + 1 uppercase letter + 2 digits + 1 uppercase letter + 1 digit)
export const ROLL_NUMBER_REGEX = /^[0-9]{2}[A-Z]{2}[0-9][A-Z][0-9]{2}[A-Z][0-9]$/;

export const validateRollNumberFormat = (roll: string): string | null => {
  if (!roll || typeof roll !== 'string') {
    return 'Student Roll Number is required (e.g. 25KN1A12C2).';
  }
  const trimmed = roll.trim();
  if (!trimmed) {
    return 'Student Roll Number is required (e.g. 25KN1A12C2).';
  }
  if (/\s/.test(trimmed)) {
    return 'Invalid Roll Number: Spaces are not allowed.';
  }
  if (/[a-z]/.test(trimmed)) {
    return 'Invalid Roll Number: Lowercase letters are not allowed. Use uppercase letters (A–Z) and digits (0–9) only.';
  }
  if (/[^A-Z0-9]/.test(trimmed)) {
    return 'Invalid Roll Number: Special characters are not allowed. Use uppercase characters (A–Z) and digits (0–9) only.';
  }
  if (trimmed.length !== 10) {
    return `Invalid Roll Number: Must be exactly 10 characters long (currently ${trimmed.length} characters). Example: 25KN1A12C2.`;
  }
  if (!ROLL_NUMBER_REGEX.test(trimmed)) {
    return 'Invalid Roll Number: Pattern must be 2 digits + 2 uppercase letters + 1 digit + 1 uppercase letter + 2 digits + 1 uppercase letter + 1 digit (e.g. 25KN1A12C2).';
  }
  return null;
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  // Mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [busStop, setBusStop] = useState('Benz Circle');
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState('III');
  const [section, setSection] = useState('A');

  const [availableStops, setAvailableStops] = useState<string[]>([
    'Benz Circle',
    'Mangalagiri Bus Stand',
    'Tadepalli Bypass',
    'Varadhi Junction',
    'Ramavarappadu Ring',
    'Prasadampadu',
    'Enikepadu Junction',
    'Nidamanuru Center',
    'Gannavaram Bus Stop',
    'High School Road',
    'Ramesh Hospitals',
    'Currency Nagar',
    'Enikepadu Center',
    'Kesarapalli',
    'Gannavaram Airport',
    'Savaragudem Junction',
    'Mustabad Cross',
    'Pothavarappadu Center'
  ]);

  useEffect(() => {
    api.getStops().then(res => {
      if (res && res.length > 0) {
        const names = Array.from(new Set(res.map((s: any) => s.stopName || s.name))).filter(Boolean);
        if (names.length > 0) setAvailableStops(names);
      }
    }).catch(() => {});
  }, []);

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your email / student ID and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.auth.login(identifier.trim(), password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your email / student ID and password.');
      }
    } catch {
      setErrorMessage('Connection failed. Please ensure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setErrorMessage('Full name is required. Please enter your name.');
      return;
    }

    const trimmedRoll = studentId.trim();
    const rollError = validateRollNumberFormat(trimmedRoll);
    if (rollError) {
      setErrorMessage(rollError);
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    if (!busStop.trim()) {
      setErrorMessage('Please select your regular boarding bus stop.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.auth.register({
        fullName: trimmedName,
        rollNumber: trimmedRoll,
        studentId: trimmedRoll,
        email: trimmedEmail,
        phoneNumber: phoneNumber.trim(),
        busStop: busStop.trim(),
        password,
        confirmPassword,
        department: department.trim() || 'CSE',
        year: year.trim() || 'III',
        section: section.trim() || 'A'
      });

      if (res.success && res.user) {
        setSuccessMessage(`Account activated successfully for ${res.user.fullName} (${res.user.rollNumber})! Logging in...`);
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 750);
      } else {
        setErrorMessage(res.error || 'Registration failed. Please check your information.');
      }
    } catch {
      setErrorMessage('Registration server unavailable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotLoading(true);
    try {
      const res = await api.auth.forgotPassword(forgotEmail.trim());
      setForgotMessage(res.message);
    } catch {
      setForgotMessage(`Password reset link dispatched to ${forgotEmail}. Please check your inbox.`);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100/70 via-sky-50 to-blue-50/50 flex flex-col justify-center items-center p-3 sm:p-6 text-slate-800 antialiased relative overflow-hidden">
      {/* Decorative Light Blue Ambient Glows */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />

      {/* Main Authentication Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-sky-900/5 border border-sky-100 w-full max-w-md p-6 sm:p-8 relative z-10 transition-all duration-300 animate-card-in">
        
        {/* Brand Header */}
        <div className="text-center space-y-2 pb-5 border-b border-sky-100/80">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-500/25 transition-transform duration-200 hover:scale-105">
            <Bus className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight">
              Transit<span className="text-sky-600">IQ</span>
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              AI-Powered Smart Transit Management
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-sky-50/80 p-1 rounded-xl max-w-xs mx-auto mt-4 border border-sky-100">
            <button
              type="button"
              id="tab-login"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="tab-signup"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* ================= SIGN IN FORM ================= */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
            {/* Email or Student Roll Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Email or Student Roll Number
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-sky-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="input-login-email"
                  required
                  placeholder="Enter email or Student ID (e.g. 25KN1A12C2)"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-sky-50/40 border border-sky-100 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-150"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(identifier);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-sky-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="input-login-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-sky-50/40 border border-sky-100 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              id="btn-login-submit"
              disabled={isLoading}
              className="w-full min-h-[46px] bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>

            {/* Switch to Sign Up Link */}
            <div className="text-center pt-3 border-t border-sky-100/80">
              <span className="text-xs text-slate-500">Don't have an account? </span>
              <button
                type="button"
                id="link-to-signup"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer transition-colors"
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* ================= CREATE ACCOUNT FORM ================= */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="mt-5 space-y-3.5">
            {/* Student Registration Callout */}
            <div className="bg-sky-50/80 border border-sky-200/80 rounded-xl p-3 flex items-start gap-2.5">
              <GraduationCap className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-sky-900">Student Commuter Registration</p>
                <p className="text-[11px] text-sky-700 leading-tight">
                  Register with your official roll number to access bus tracking and seat verification.
                </p>
              </div>
            </div>

            {/* Full Name & Student ID in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="input-signup-name"
                    required
                    placeholder="e.g. Venkat Gowtham"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-sky-50/40 border border-sky-100 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-150"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Student Roll Number *</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="input-signup-roll"
                    required
                    maxLength={10}
                    placeholder="e.g. 25KN1A12C2"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.toUpperCase().replace(/\s/g, ''))}
                    className={`w-full pl-9 pr-3 py-2 bg-sky-50/40 border rounded-xl text-xs sm:text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 transition-all duration-150 ${
                      studentId.length === 10 && ROLL_NUMBER_REGEX.test(studentId)
                        ? 'border-emerald-500 focus:ring-emerald-500/20 focus:border-emerald-600'
                        : studentId.length > 0 && !ROLL_NUMBER_REGEX.test(studentId)
                        ? 'border-amber-400 focus:ring-amber-500/20 focus:border-amber-500'
                        : 'border-sky-100 focus:ring-sky-500/20 focus:border-sky-500'
                    }`}
                  />
                </div>
                {/* Clear validation message */}
                <div id="signup-roll-validation-msg" className="text-[11px] mt-1 transition">
                  {studentId.length === 0 ? (
                    <p className="text-slate-400">Format: 25KN1A12C2 (10 characters)</p>
                  ) : studentId.length === 10 && ROLL_NUMBER_REGEX.test(studentId) ? (
                    <p className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Valid Roll Number: {studentId}</span>
                    </p>
                  ) : (
                    <p className="text-amber-700 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{validateRollNumberFormat(studentId) || 'Must match pattern e.g. 25KN1A12C2'}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Email & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="input-signup-email"
                    required
                    placeholder="student@transitiq.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-sky-50/40 border border-sky-100 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-150"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Phone Number</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    id="input-signup-phone"
                    placeholder="e.g. +91 98480 54321"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-sky-50/40 border border-sky-100 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-150"
                  />
                </div>
              </div>
            </div>

            {/* Boarding Bus Stop Selection */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Boarding Bus Stop *</span>
                <span className="text-[10px] text-sky-600 font-medium">Auto-Links Bus Route</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-sky-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="select-signup-bus-stop"
                  required
                  value={busStop}
                  onChange={(e) => setBusStop(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-sky-50/40 border border-sky-100 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-150 cursor-pointer"
                >
                  {availableStops.map((stop) => (
                    <option key={stop} value={stop}>
                      {stop}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department, Year & Section in 3 columns */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1 col-span-1">
                <label className="text-xs font-bold text-slate-700">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-2.5 py-2 bg-sky-50/40 border border-sky-100 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-150 cursor-pointer"
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

              <div className="space-y-1 col-span-1">
                <label className="text-xs font-bold text-slate-700">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-2.5 py-2 bg-sky-50/40 border border-sky-100 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-150 cursor-pointer"
                >
                  <option value="I">Year I</option>
                  <option value="II">Year II</option>
                  <option value="III">Year III</option>
                  <option value="IV">Year IV</option>
                </select>
              </div>

              <div className="space-y-1 col-span-1">
                <label className="text-xs font-bold text-slate-700">Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-2.5 py-2 bg-sky-50/40 border border-sky-100 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-150 cursor-pointer"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-signup-password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/40 border border-sky-100 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="input-signup-confirm-password"
                    required
                    placeholder="Re-type password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/40 border border-sky-100 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Create Account Button */}
            <button
              type="submit"
              id="btn-signup-submit"
              disabled={isLoading}
              className="w-full min-h-[44px] bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 active:scale-[0.99] text-white font-bold py-2.5 px-4 rounded-xl transition duration-150 shadow-md shadow-sky-500/20 hover:shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-60 mt-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>

            {/* Back to Sign In Link */}
            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">Already have an account? </span>
              <button
                type="button"
                id="link-to-signin"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer transition-colors"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-sky-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-sm text-slate-900 font-['Outfit']">Password Recovery</h3>
              </div>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotMessage(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotMessage ? (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 space-y-2">
                <p className="leading-relaxed">{forgotMessage}</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotMessage(null);
                  }}
                  className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered email address to receive password reset instructions.
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-50/40 border border-sky-100 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {forgotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
