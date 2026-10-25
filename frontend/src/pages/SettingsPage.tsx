import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  LogOut, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Lock, 
  Sparkles,
  Hash,
  Loader2,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { UserRole } from '../types';

interface SettingsPageProps {
  currentUser?: any;
  userRole?: UserRole;
  onUpdateCurrentUser?: (updatedUser: any) => void;
  onLogout?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  userRole = 'STUDENT',
  onUpdateCurrentUser,
  onLogout
}) => {
  // 1. Edit Name
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [savingName, setSavingName] = useState(false);

  // 2. Edit Roll Number
  const [rollNumber, setRollNumber] = useState(currentUser?.rollNumber || '');
  const [savingRoll, setSavingRoll] = useState(false);

  // 3. Edit Email
  const [email, setEmail] = useState(currentUser?.email || '');
  const [savingEmail, setSavingEmail] = useState(false);

  // 4. Edit Phone Number
  const [phone, setPhone] = useState(currentUser?.phoneNumber || currentUser?.phone || '');
  const [savingPhone, setSavingPhone] = useState(false);

  // 5. Transit Organization Details
  const [collegeDetails, setCollegeDetails] = useState({
    name: 'TransitIQ Smart Transit Network',
    campus: 'Central Transit Terminal, Vijayawada Mobility Hub, AP',
    transportContact: 'TransitIQ Operations Helpdesk: +91 98480 12345 / ops@transitiq.network'
  });
  const [savingCollege, setSavingCollege] = useState(false);

  // Global Alert Message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync state when currentUser prop updates
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setRollNumber(currentUser.rollNumber || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phoneNumber || currentUser.phone || '');
    }
  }, [currentUser]);

  // Load college details from API
  useEffect(() => {
    async function loadCollege() {
      try {
        const details = await api.getCollegeDetails();
        if (details) {
          setCollegeDetails({
            name: details.name || 'TransitIQ Smart Transit Network',
            campus: details.campus || 'Central Transit Terminal, Vijayawada Mobility Hub, AP',
            transportContact: details.transportContact || 'TransitIQ Operations Helpdesk: +91 98480 12345 / ops@transitiq.network'
          });
        }
      } catch (err) {
        console.warn('Could not load college details:', err);
      }
    }
    loadCollege();
  }, []);

  // Strict Roll Number Regex (Exactly 10 chars: 2 digits + 2 uppercase letters + 1 digit + 1 uppercase letter + 2 digits + 1 uppercase letter + 1 digit)
  const ROLL_NUMBER_REGEX = /^[0-9]{2}[A-Z]{2}[0-9][A-Z][0-9]{2}[A-Z][0-9]$/;

  const validateRollNumberClient = (roll: string) => {
    const trimmed = roll.trim();
    if (!trimmed) {
      return 'Roll number cannot be empty.';
    }
    if (/\s/.test(trimmed)) {
      return 'Spaces are not allowed.';
    }
    if (/[a-z]/.test(trimmed)) {
      return 'Lowercase letters are not allowed. Use uppercase letters (A–Z) and digits (0–9) only.';
    }
    if (/[^A-Z0-9]/.test(trimmed)) {
      return 'Special characters are not allowed. Use uppercase characters (A–Z) and digits (0–9) only.';
    }
    if (trimmed.length !== 10) {
      return `Roll number must be exactly 10 characters long (currently ${trimmed.length} characters). Example: 25KN1A12C2.`;
    }
    if (!ROLL_NUMBER_REGEX.test(trimmed)) {
      return 'Pattern must be 2 digits + 2 uppercase letters + 1 digit + 1 uppercase letter + 2 digits + 1 uppercase letter + 1 digit (e.g. 25KN1A12C2).';
    }
    return null;
  };

  // Handler: Save Name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const trimmed = fullName.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: 'Name cannot be empty. Please enter your full name.' });
      return;
    }

    setSavingName(true);
    const res = await api.updateProfile({ fullName: trimmed });
    setSavingName(false);

    if (res.success && res.user) {
      setFeedback({ type: 'success', message: 'Student name updated successfully!' });
      if (onUpdateCurrentUser) onUpdateCurrentUser(res.user);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to update name.' });
    }
  };

  // Handler: Save Roll Number
  const handleSaveRollNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const validationError = validateRollNumberClient(rollNumber);
    if (validationError) {
      setFeedback({ type: 'error', message: validationError });
      return;
    }

    setSavingRoll(true);
    const res = await api.updateProfile({ rollNumber: rollNumber.trim() });
    setSavingRoll(false);

    if (res.success && res.user) {
      setFeedback({ type: 'success', message: `Roll Number verified and updated to "${res.user.rollNumber}"!` });
      if (onUpdateCurrentUser) onUpdateCurrentUser(res.user);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to update roll number.' });
    }
  };

  // Handler: Save Email
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setFeedback({ type: 'error', message: 'Please enter a valid college email address (e.g. rollnumber@nriit.edu.in).' });
      return;
    }

    setSavingEmail(true);
    const res = await api.updateProfile({ email: trimmed });
    setSavingEmail(false);

    if (res.success && res.user) {
      setFeedback({ type: 'success', message: 'College email synchronized and updated successfully!' });
      if (onUpdateCurrentUser) onUpdateCurrentUser(res.user);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to update email address.' });
    }
  };

  // Handler: Save Phone Number
  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const trimmed = phone.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: 'Phone number cannot be empty.' });
      return;
    }

    setSavingPhone(true);
    const res = await api.updateProfile({ phoneNumber: trimmed, phone: trimmed });
    setSavingPhone(false);

    if (res.success && res.user) {
      setFeedback({ type: 'success', message: 'Contact phone number saved successfully!' });
      if (onUpdateCurrentUser) onUpdateCurrentUser(res.user);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to update phone number.' });
    }
  };

  // Handler: Save College Details (Admin only)
  const handleSaveCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (userRole !== 'ADMIN') {
      setFeedback({ type: 'error', message: 'Permission Denied: Only transport administrators can modify institutional details.' });
      return;
    }

    setSavingCollege(true);
    const res = await api.updateCollegeDetails(collegeDetails);
    setSavingCollege(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Shared college information updated successfully!' });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to update college details.' });
    }
  };

  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Manage your personal account profile, contact information, institutional college details, and active session.
        </p>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs animate-in fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button 
            onClick={() => setFeedback(null)} 
            className="text-slate-400 hover:text-slate-700 font-bold ml-2 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Settings Sections Grid */}
      <div className="space-y-4">
        {/* 1. Edit Name */}
        <div className="bg-white rounded-3xl border border-sky-100 p-5 sm:p-6 shadow-xs card-hover">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-['Outfit']">
                1. Edit Name
              </h2>
              <p className="text-xs text-slate-500">Update your official student/user name displayed on profile cards</p>
            </div>
          </div>

          <form onSubmit={handleSaveName} className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                required
                id="input-edit-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name (e.g. Shaajani)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-600 text-xs font-semibold"
              />
            </div>
            <button
              type="submit"
              disabled={savingName}
              id="btn-save-name"
              className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-bold text-xs px-5 py-2.5 min-h-[42px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs btn-hover"
            >
              {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Name</span>
            </button>
          </form>
        </div>

        {/* 2. Edit Roll Number */}
        <div className="bg-white rounded-3xl border border-sky-100 p-5 sm:p-6 shadow-xs card-hover">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 font-['Outfit']">
                  2. Edit Roll Number
                </h2>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  Strict 10-Char Format (25KN1A12C2)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pattern: Exactly 10 uppercase characters: 2 digits + 2 letters + 1 digit + 1 letter + 2 digits + 1 letter + 1 digit (e.g. 25KN1A12C2)
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveRollNumber} className="mt-4 space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  required
                  maxLength={10}
                  id="input-edit-roll"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  placeholder="Roll Number (e.g. 25KN1A12C2)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-600 text-xs font-mono font-bold uppercase tracking-wider"
                />
              </div>
              <button
                type="submit"
                disabled={savingRoll}
                id="btn-save-roll"
                className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-bold text-xs px-5 py-2.5 min-h-[42px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs btn-hover"
              >
                {savingRoll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Roll Number</span>
              </button>
            </div>
            {/* Clear validation message beside / below field */}
            <div id="settings-roll-validation-msg" className="text-[11px] pt-1">
              {rollNumber.trim().length === 0 ? (
                <p className="text-slate-400">Pattern: 2 digits + 2 letters + 1 digit + 1 letter + 2 digits + 1 letter + 1 digit (e.g. 25KN1A12C2)</p>
              ) : rollNumber.trim().length === 10 && ROLL_NUMBER_REGEX.test(rollNumber.trim()) ? (
                <p className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Valid Roll Number format ({rollNumber.trim()})</span>
                </p>
              ) : (
                <p className="text-amber-700 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validateRollNumberClient(rollNumber) || 'Must match pattern e.g. 25KN1A12C2'}</span>
                </p>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Validation Rule: Must match regular expression <code className="text-blue-600 bg-slate-100 px-1 py-0.5 rounded font-mono">^[0-9]&#123;2&#125;[A-Z]&#123;2&#125;[0-9][A-Z][0-9]&#123;2&#125;[A-Z][0-9]$</code>. Example: 25KN1A12C2.
            </p>
          </form>
        </div>

        {/* 3. Edit Email */}
        <div className="bg-white rounded-3xl border border-sky-100 p-5 sm:p-6 shadow-xs card-hover">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-['Outfit']">
                3. Edit Email
              </h2>
              <p className="text-xs text-slate-500">Synchronized college mailbox used for authentication and notifications</p>
            </div>
          </div>

          <form onSubmit={handleSaveEmail} className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <input
                type="email"
                required
                id="input-edit-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="College Email (e.g. shaaji@nriit.edu.in)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-600 text-xs font-semibold"
              />
            </div>
            <button
              type="submit"
              disabled={savingEmail}
              id="btn-save-email"
              className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-bold text-xs px-5 py-2.5 min-h-[42px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs btn-hover"
            >
              {savingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Email</span>
            </button>
          </form>
        </div>

        {/* 4. Edit Phone Number */}
        <div className="bg-white rounded-3xl border border-sky-100 p-5 sm:p-6 shadow-xs card-hover">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 font-['Outfit']">
                  4. Edit Phone Number
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  SMS Dispatch Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">Contact number for bus arrival SMS alerts and route delays</p>
            </div>
          </div>

          <form onSubmit={handleSavePhone} className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <input
                type="tel"
                required
                id="input-edit-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number (e.g. +91 98480 54321)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-600 text-xs font-mono font-semibold"
              />
            </div>
            <button
              type="submit"
              disabled={savingPhone}
              id="btn-save-phone"
              className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-bold text-xs px-5 py-2.5 min-h-[42px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs btn-hover"
            >
              {savingPhone ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Phone</span>
            </button>
          </form>
        </div>

        {/* 5. College Details */}
        <div className="bg-white rounded-3xl border border-sky-100 p-5 sm:p-6 shadow-xs card-hover">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 font-['Outfit']">
                  5. Organization Details
                </h2>
                <p className="text-xs text-slate-500">Transit network identity and operations helpline information</p>
              </div>
            </div>

            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              isAdmin 
                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {isAdmin ? 'Admin Editable' : 'Network Reference (Read-Only)'}
            </span>
          </div>

          <form onSubmit={handleSaveCollege} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Organization / Network Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={collegeDetails.name}
                onChange={(e) => setCollegeDetails({ ...collegeDetails, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 disabled:bg-slate-50 disabled:text-slate-700 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Hub Location</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={collegeDetails.campus}
                onChange={(e) => setCollegeDetails({ ...collegeDetails, campus: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 disabled:bg-slate-50 disabled:text-slate-700 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Transport Helpline & Email</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={collegeDetails.transportContact}
                onChange={(e) => setCollegeDetails({ ...collegeDetails, transportContact: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 disabled:bg-slate-50 disabled:text-slate-700 text-xs font-mono"
              />
            </div>

            {isAdmin && (
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingCollege}
                  id="btn-save-college"
                  className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-bold text-xs px-5 py-2.5 min-h-[42px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs btn-hover"
                >
                  {savingCollege ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Organization Details</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* 6. Log Out */}
        <div className="bg-red-50/60 rounded-3xl border border-red-200 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-red-950 font-['Outfit']">
                6. Log Out
              </h2>
              <p className="text-xs text-red-800">
                End your authenticated student session securely and redirect to Sign In
              </p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              id="btn-settings-logout"
              className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-5 py-2.5 min-h-[44px] rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
