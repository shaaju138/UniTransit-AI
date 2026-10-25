import React from 'react';
import {
  LayoutDashboard,
  Radio,
  MapPin,
  GraduationCap,
  QrCode,
  ScanLine,
  KeyRound,
  BrainCircuit,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Bus,
  ArrowRightLeft,
  Settings,
  X,
  Shield,
  ShieldCheck,
  User
} from 'lucide-react';
import { UserRole } from '../types';

export type NavTab = 
  | 'dashboard'
  | 'live-monitoring'
  | 'routes'
  | 'attendance'
  | 'qr-attendance'
  | 'bus-boarding'
  | 'ai-predictions'
  | 'ai-alerts'
  | 'recommendations'
  | 'analytics'
  | 'bus-management'
  | 'bus-allocation'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadAlertsCount: number;
  pendingRecCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  userRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unreadAlertsCount,
  pendingRecCount,
  isMobileOpen = false,
  onCloseMobile,
  userRole = 'ADMIN'
}) => {
  const allNavItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      badge: null,
      roles: ['ADMIN', 'FACULTY', 'STUDENT'] as UserRole[]
    },
    { 
      id: 'live-monitoring', 
      label: 'Live Bus Monitoring', 
      icon: Radio, 
      badge: 'Live', 
      badgeColor: 'bg-emerald-100 text-emerald-700',
      roles: ['ADMIN', 'FACULTY'] as UserRole[]
    },
    { 
      id: 'routes', 
      label: 'Routes', 
      icon: MapPin, 
      badge: '3 Active',
      roles: ['ADMIN', 'FACULTY', 'STUDENT'] as UserRole[]
    },
    { 
      id: 'attendance', 
      label: 'Attendance', 
      icon: GraduationCap, 
      badge: '91%',
      roles: ['ADMIN', 'FACULTY'] as UserRole[]
    },
    { 
      id: 'qr-attendance', 
      label: 'QR Attendance', 
      icon: QrCode, 
      badge: 'Faculty', 
      badgeColor: 'bg-indigo-100 text-indigo-700',
      roles: ['ADMIN', 'FACULTY'] as UserRole[]
    },
    { 
      id: 'bus-boarding', 
      label: 'Bus Boarding', 
      icon: KeyRound, 
      badge: 'PIN', 
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
      roles: ['ADMIN', 'STUDENT'] as UserRole[]
    },
    { 
      id: 'ai-predictions', 
      label: 'AI Predictions', 
      icon: BrainCircuit, 
      badge: 'R² 0.95', 
      badgeColor: 'bg-purple-100 text-purple-700',
      roles: ['ADMIN', 'FACULTY'] as UserRole[]
    },
    { 
      id: 'ai-alerts', 
      label: 'AI Alerts', 
      icon: AlertTriangle, 
      badge: unreadAlertsCount > 0 ? `${unreadAlertsCount}` : null, 
      badgeColor: 'bg-red-100 text-red-700 animate-pulse font-bold',
      roles: ['ADMIN', 'FACULTY'] as UserRole[]
    },
    { 
      id: 'recommendations', 
      label: 'Recommendations', 
      icon: Lightbulb, 
      badge: pendingRecCount > 0 ? `${pendingRecCount} Action` : null, 
      badgeColor: 'bg-amber-100 text-amber-800',
      roles: ['ADMIN'] as UserRole[]
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3, 
      badge: null,
      roles: ['ADMIN', 'FACULTY'] as UserRole[]
    },
    { 
      id: 'bus-management', 
      label: 'Bus Management', 
      icon: Bus, 
      badge: 'Fleet',
      roles: ['ADMIN'] as UserRole[]
    },
    { 
      id: 'bus-allocation', 
      label: 'TransitIQ Bus Allocation', 
      icon: ArrowRightLeft, 
      badge: 'AI Action', 
      badgeColor: 'bg-blue-100 text-blue-800 font-bold',
      roles: ['ADMIN'] as UserRole[]
    },
    { 
      id: 'settings', 
      label: 'Settings & Scope', 
      icon: Settings, 
      badge: null,
      roles: ['ADMIN', 'FACULTY', 'STUDENT'] as UserRole[]
    }
  ];

  // RBAC Navigation Filtering
  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  const handleTabClick = (tabId: NavTab) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <>
      {/* Brand Title Area */}
      <div className="p-4 border-b border-sky-100 flex items-center justify-between shrink-0 bg-sky-50/60">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600">
            AI TRANSIT
          </div>
          <div className="text-base font-extrabold text-slate-900 tracking-wide font-['Outfit']">
            Transit<span className="text-sky-600">IQ</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full font-mono font-bold">
            v1.0
          </span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden min-h-[36px] min-w-[36px] p-1.5 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 flex items-center justify-center transition cursor-pointer"
              aria-label="Close Mobile Navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Role Pill in Sidebar */}
      <div className="px-3.5 py-2 bg-sky-50/30 border-b border-sky-100 flex items-center justify-between text-xs">
        <span className="text-[10px] text-sky-800/70 font-bold uppercase tracking-wider">
          Access Level
        </span>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-sky-100 text-sky-800 border border-sky-200 shadow-2xs">
          {userRole === 'ADMIN' && <ShieldCheck className="w-3 h-3 text-sky-600" />}
          {userRole === 'FACULTY' && <GraduationCap className="w-3 h-3 text-blue-600" />}
          {userRole === 'STUDENT' && <User className="w-3 h-3 text-emerald-600" />}
          <span>{userRole}</span>
        </span>
      </div>

      {/* Nav List with smooth touch scrolling */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1 touch-scroll">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id as NavTab)}
              id={`nav-${item.id}`}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group min-h-[44px] cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-sm shadow-sky-500/25'
                  : 'text-slate-600 hover:text-sky-800 hover:bg-sky-50 active:bg-sky-100/70 hover:translate-x-0.5'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-600'
                  }`}
                />
                <span className="truncate text-left">{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || 'bg-sky-100 text-sky-800 border border-sky-200/60'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info in Sidebar */}
      <div className="p-3 border-t border-sky-100 text-[10px] text-sky-700/70 font-mono text-center shrink-0 bg-sky-50/30">
        TransitIQ • Smart Transit
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop & Tablet Sidebar */}
      <aside className="hidden lg:flex w-60 xl:w-64 bg-white/95 backdrop-blur-md text-slate-700 flex-col border-r border-sky-100 shadow-xs shrink-0 h-full">
        {navContent}
      </aside>

      {/* 2. Mobile Navigation Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <aside
            className="relative z-50 w-72 max-w-[85vw] bg-white text-slate-700 flex flex-col border-r border-sky-100 shadow-2xl h-full animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-label="Mobile Navigation Drawer"
          >
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
