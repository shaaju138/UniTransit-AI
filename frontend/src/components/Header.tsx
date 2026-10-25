import React, { useState } from 'react';
import { 
  Building2, 
  Bell, 
  User, 
  ChevronDown, 
  Bus,
  CheckCircle2,
  Menu,
  X,
  LogOut,
  Settings
} from 'lucide-react';
import { College, UserRole } from '../types';

interface HeaderProps {
  college: College;
  currentUser?: any;
  userRole: UserRole;
  onChangeRole?: (role: UserRole) => void;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onLogout?: () => void;
  onNavigateSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  college,
  currentUser,
  userRole,
  unreadAlertsCount,
  onOpenAlerts,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  onLogout,
  onNavigateSettings
}) => {
  const [showNriitDropdown, setShowNriitDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const getUserIdentifier = () => {
    if (currentUser?.fullName) return currentUser.fullName;
    if (currentUser?.user_metadata?.full_name) return currentUser.user_metadata.full_name;
    if (currentUser?.email) return currentUser.email;
    return 'Authenticated User';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs w-full min-w-0">
      {/* Top Banner Notice - Responsive */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-sky-700 text-white px-3 sm:px-4 py-1 text-[11px] sm:text-xs flex items-center justify-between border-b border-sky-500/30 w-full overflow-hidden shadow-2xs">
        <div className="flex items-center gap-1.5 sm:gap-2 truncate font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 animate-pulse shrink-0"></span>
          <span className="truncate">TransitIQ Intelligent Transit Network</span>
          <span className="text-sky-200 hidden md:inline">|</span>
          <span className="text-emerald-200 font-semibold hidden md:inline">● Live Operations</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-white shrink-0 ml-2 font-medium">
          <span className="bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/30 font-bold">
            TransitIQ Fleet
          </span>
          <span className="text-sky-100 hidden sm:inline">AI R²: 0.954</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 w-full">
        {/* Left: Hamburger Button (Mobile/Tablet) & Branding */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Navigation Drawer Toggle */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-800 border border-sky-200/60 flex items-center justify-center transition shrink-0 cursor-pointer"
              aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-sky-900" />
              ) : (
                <Menu className="w-5 h-5 text-sky-900" />
              )}
            </button>
          )}

          {/* Logo Icon */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md shadow-sky-500/20 border border-sky-400/40 shrink-0">
            <Bus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>

          {/* College & App Title */}
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-slate-900 font-['Outfit'] truncate">
                Transit<span className="text-sky-600 font-extrabold">IQ</span>
              </h1>
              <span className="hidden sm:inline-flex bg-sky-100 text-sky-800 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border border-sky-200 shrink-0">
                Live
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate hidden md:block">
              AI-Powered Smart Transit Management
            </p>
          </div>
        </div>

        {/* Right: Controls (Transit Network dropdown, Role selector, Alerts notification) */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
          {/* Transit Network Dropdown (Hidden on small mobile, visible on sm+) */}
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                setShowNriitDropdown(!showNriitDropdown);
                setShowProfileDropdown(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 bg-sky-50/80 hover:bg-sky-100 text-sky-900 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border border-sky-200/80 transition min-h-[40px] cursor-pointer shadow-2xs"
              title="Transit Network Overview"
            >
              <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="font-bold text-slate-900 max-w-[110px] lg:max-w-[180px] truncate">
                TransitIQ Network
              </span>
              <ChevronDown className="w-3 h-3 text-sky-500 shrink-0" />
            </button>

            {showNriitDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setShowNriitDropdown(false)} 
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3.5 z-50 animate-in fade-in">
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">TransitIQ Transit Network</p>
                      <p className="text-[10px] text-slate-500">Autonomous Regional Transit & Fleet Dispatch</p>
                    </div>
                  </div>

                  <div className="mt-2.5 space-y-1.5 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hub:</span>
                      <span className="font-medium text-slate-800 text-right">Central Transit Terminal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fleet Inventory:</span>
                      <span className="font-mono font-bold text-blue-700">12 Total (4 Standby)</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Authenticated User Profile (Student Profile in Top-Right or Admin/Faculty) */}
          <div className="relative">
            {userRole === 'STUDENT' ? (
              <button
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNriitDropdown(false);
                }}
                id="btn-student-header-profile"
                className="flex items-center gap-2 bg-gradient-to-r from-sky-50 to-blue-50/80 hover:from-sky-100/90 hover:to-blue-100/90 px-2.5 sm:px-3 py-1.5 rounded-xl border border-sky-200/90 text-left transition cursor-pointer shadow-2xs"
                aria-label="Student Profile"
                title="Student Profile & Bus Assignment"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left text-xs leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 truncate max-w-[100px] sm:max-w-[140px]">
                      {currentUser?.fullName || 'Student'}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-sky-800 bg-sky-100 px-1.5 py-0.2 rounded border border-sky-200">
                      {currentUser?.rollNumber || 'Not Set'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5">
                    <span className="truncate max-w-[95px] sm:max-w-[130px] font-medium text-slate-700">
                      Stop: <strong>{currentUser?.busStop || 'Benz Circle'}</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                      {currentUser?.assignedBus || 'Bus 31'}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-sky-500 shrink-0 ml-0.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNriitDropdown(false);
                }}
                className="flex items-center gap-1.5 sm:gap-2 bg-sky-50/80 hover:bg-sky-100 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-900 border border-sky-200/80 min-h-[44px] transition cursor-pointer shadow-2xs"
                aria-label="User Profile"
              >
                <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                  <User className="w-3.5 h-3.5 text-sky-700" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="font-bold text-slate-900 text-xs max-w-[130px] lg:max-w-[180px] truncate leading-tight">
                    {getUserIdentifier()}
                  </p>
                  <span className="text-[10px] text-sky-700 font-bold uppercase tracking-wider">
                    {userRole}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-sky-500 shrink-0" />
              </button>
            )}

            {showProfileDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setShowProfileDropdown(false)} 
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-sky-100 p-3.5 z-50 animate-in fade-in duration-150">
                  {userRole === 'STUDENT' ? (
                    <div className="pb-3 border-b border-sky-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          Student Profile
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      </div>

                      <div className="bg-sky-50/40 rounded-xl p-3 border border-sky-100 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Name:</span>
                          <span className="font-bold text-slate-900">{currentUser?.fullName || 'Student'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Roll Number:</span>
                          <span className="font-mono font-bold text-sky-700">{currentUser?.rollNumber || 'Not Set'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Bus Stop:</span>
                          <span className="font-semibold text-slate-800">{currentUser?.busStop || 'Benz Circle'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Assigned Bus:</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {currentUser?.assignedBus || 'Bus 31'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pb-3 border-b border-sky-100">
                      <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider block mb-1">
                        Authenticated Account
                      </span>
                      <p className="font-extrabold text-slate-900 text-xs">
                        {currentUser?.fullName || currentUser?.user_metadata?.full_name || 'Verified Commuter'}
                      </p>
                      <p className="text-[11px] text-slate-500 break-all mt-0.5">
                        {currentUser?.email || 'Authenticated Account'}
                      </p>
                      {currentUser?.department && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Dept: <strong className="text-slate-600">{currentUser.department}</strong>
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified Session</span>
                        </span>
                        <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                          {userRole}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-2.5 pt-1 space-y-1">
                    {onNavigateSettings && (
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          onNavigateSettings();
                        }}
                        id="btn-header-settings"
                        className="w-full text-left px-2.5 py-2 text-xs flex items-center gap-2 text-slate-700 hover:bg-sky-50 hover:text-sky-800 font-semibold rounded-xl cursor-pointer transition"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        <span>Settings</span>
                      </button>
                    )}

                    {onLogout && (
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          onLogout();
                        }}
                        id="btn-logout-header"
                        className="w-full text-left px-2.5 py-2 text-xs flex items-center gap-2 text-red-600 hover:bg-red-50 font-semibold rounded-xl cursor-pointer transition"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-500" />
                        <span>Log Out</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notification Alert Bell Icon */}
          <button
            onClick={onOpenAlerts}
            id="btn-alerts-header"
            className="relative min-h-[44px] min-w-[44px] p-2 text-sky-700 hover:text-sky-900 bg-sky-50/80 hover:bg-sky-100 border border-sky-200/80 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
            title="View AI Overcrowding Alerts"
            aria-label={`View AI Alerts. ${unreadAlertsCount} unread`}
          >
            <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
