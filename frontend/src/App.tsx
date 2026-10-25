import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { RoutesPage } from './pages/RoutesPage';
import { AIPredictionsPage } from './pages/AIPredictionsPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { BusManagementPage } from './pages/BusManagementPage';
import { BusAllocationPage } from './pages/BusAllocationPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { api } from './services/api';
import { Bus, Loader2 } from 'lucide-react';
import { College, RouteItem, Vehicle, Recommendation, UserRole } from './types';
import { INITIAL_COLLEGES, INITIAL_ROUTES, INITIAL_VEHICLES, INITIAL_RECOMMENDATIONS } from './data/mockData';

export function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('STUDENT');
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  // Data state (TransitIQ Environment)
  const [college] = useState<College>(INITIAL_COLLEGES[0]);
  const [routes, setRoutes] = useState<RouteItem[]>(INITIAL_ROUTES);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(INITIAL_RECOMMENDATIONS);

  // 1. Session Persistence & Verification Guard
  useEffect(() => {
    async function verifySession() {
      try {
        const user = await api.auth.getMe();
        if (user) {
          setCurrentUser(user);
          const role = (user.role || 'STUDENT').toUpperCase() as UserRole;
          setUserRole(role);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('Session verification note:', err);
        setCurrentUser(null);
      } finally {
        setIsAuthChecking(false);
      }
    }
    verifySession();

    // Prevent browser bfcache/back navigation from exposing protected dashboard after logout
    const handlePageShow = () => {
      if (!api.auth.getToken()) {
        setCurrentUser(null);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // Enforce role-based access for tabs so direct navigation is strictly guarded
  useEffect(() => {
    if (!currentUser) return;
    const adminOnlyTabs: NavTab[] = ['bus-management', 'bus-allocation', 'recommendations'];

    if (userRole === 'STUDENT' && adminOnlyTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [userRole, activeTab, currentUser]);

  // 2. Initial Data Loading from Backend API
  useEffect(() => {
    async function loadData() {
      try {
        const [routeRes, vehRes, recRes] = await Promise.all([
          api.getRoutes(),
          api.getVehicles(),
          api.getRecommendations()
        ]);
        if (routeRes) setRoutes(routeRes);
        if (vehRes) setVehicles(vehRes);
        if (recRes) setRecommendations(recRes);
      } catch (err) {
        console.warn('Initial data load warning:', err);
      }
    }
    loadData();
  }, []);

  // Handlers
  const handleApplyRecommendation = async (id: string) => {
    const res = await api.applyRecommendation(id);
    const [updatedRecs, updatedRoutes, updatedVehs] = await Promise.all([
      api.getRecommendations(),
      api.getRoutes(),
      api.getVehicles()
    ]);
    if (updatedRecs) setRecommendations([...updatedRecs]);
    if (updatedRoutes) setRoutes([...updatedRoutes]);
    if (updatedVehs) setVehicles([...updatedVehs]);
    return res;
  };

  const handleAddRoute = async (newRoute: Partial<RouteItem>) => {
    const created = await api.addRoute(newRoute);
    setRoutes(prev => [...prev, created]);
    return created;
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setCurrentUser(null);
    setUserRole('STUDENT');
    setActiveTab('dashboard');
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const pendingRecCount = recommendations.filter(r => r.status === 'pending').length;

  // Session Verification Loading Splash
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50/70 to-indigo-50/50 flex flex-col items-center justify-center text-slate-800 antialiased">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center shadow-xl shadow-sky-500/25 mb-4 animate-bounce">
          <Bus className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold font-['Outfit'] text-slate-900 tracking-tight">TransitIQ</h2>
        <p className="text-xs font-semibold text-sky-700 mt-2 flex items-center gap-2 bg-sky-100/90 px-3.5 py-1.5 rounded-full border border-sky-200">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
          <span>Restoring secure session...</span>
        </p>
      </div>
    );
  }

  // Authentication Protection Guard (Unauthenticated Access Redirects to Login)
  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          const role = (user.role || user.user_metadata?.role || 'STUDENT').toUpperCase() as UserRole;
          setUserRole(role);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50/60 via-slate-50 to-blue-50/40 flex flex-col antialiased w-full overflow-x-hidden">
      {/* Universal Header with Mobile Menu Toggle, Profile, and Working Logout */}
      <Header
        college={college}
        currentUser={currentUser}
        userRole={userRole}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onLogout={handleLogout}
        onNavigateSettings={() => setActiveTab('settings')}
      />

      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* Universal Sidebar & Mobile Drawer with Student & Admin Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(t) => {
            setActiveTab(t);
            setIsMobileMenuOpen(false);
          }}
          pendingRecCount={pendingRecCount}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          userRole={userRole}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 lg:p-7 min-w-0 touch-scroll">
          <div key={activeTab} className="max-w-[1600px] w-full mx-auto min-w-0 animate-page-in">
            {activeTab === 'dashboard' && (
              <Dashboard
                routes={routes}
                vehicles={vehicles}
                currentUser={currentUser}
                onNavigateTab={(t) => setActiveTab(t)}
                onApplyRecommendation={handleApplyRecommendation}
                userRole={userRole}
                onRefreshData={async () => {
                  const [routeRes, vehRes] = await Promise.all([
                    api.getRoutes(),
                    api.getVehicles()
                  ]);
                  if (routeRes) setRoutes(routeRes);
                  if (vehRes) setVehicles(vehRes);
                }}
              />
            )}

            {activeTab === 'live-monitoring' && (
              <LiveMonitoring routes={routes} />
            )}

            {activeTab === 'routes' && (
              <RoutesPage
                routes={routes}
                onAddRoute={handleAddRoute}
              />
            )}

            {activeTab === 'ai-predictions' && (
              <AIPredictionsPage
                routes={routes}
                onNavigateTab={(t) => setActiveTab(t)}
              />
            )}

            {activeTab === 'recommendations' && (
              <RecommendationsPage
                recommendations={recommendations}
                onApplyRecommendation={handleApplyRecommendation}
                onNavigateTab={(t) => setActiveTab(t)}
              />
            )}

            {activeTab === 'bus-management' && (
              <BusManagementPage vehicles={vehicles} />
            )}

            {activeTab === 'bus-allocation' && (
              <BusAllocationPage
                routes={routes}
                vehicles={vehicles}
                onApplyRecommendation={handleApplyRecommendation}
                onNavigateTab={(t) => setActiveTab(t)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPage 
                currentUser={currentUser} 
                userRole={userRole}
                onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
                onLogout={handleLogout} 
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
