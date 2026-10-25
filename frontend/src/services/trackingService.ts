import { useState, useEffect } from 'react';
import { api } from './api';

export interface BusTrackingState {
  busId: string;
  busNumber: string;
  routeId: string;
  routeName: string;
  isSimulated: boolean;
  modeLabel: string;
  isMoving: boolean;
  status: string;
  statusDescription: string;
  currentStopName: string;
  nextStopName: string;
  currentStop?: { id?: string; name: string; x: number; y: number; lat: number; lng: number; km?: number };
  nextStop?: { id?: string; name: string; x: number; y: number; lat: number; lng: number; km?: number };
  etaMinutes: number;
  speedKmph: number;
  dwellRemainingSeconds: number;
  dwellTotalSeconds: number;
  coordinates: { x: number; y: number; lat: number; lng: number };
  direction: string;
  lastUpdate: string;
}

export interface OtherBusTrackingState {
  busId: string;
  busNumber: string;
  assignedRouteId: string | null;
  routeName: string;
  isMoving: boolean;
  trackingStatus: string;
  modeLabel: string;
  status: string;
  currentLocation: string;
  coordinates: { x: number; y: number; lat: number; lng: number };
  speedKmph: number;
}

export interface LiveTrackingResponse {
  success: boolean;
  trackingMode: string;
  disclaimer: string;
  bus31: BusTrackingState;
  otherBuses: OtherBusTrackingState[];
  allStops: Array<{ id: string; name: string; x: number; y: number; lat: number; lng: number; km: number }>;
  timestamp: string;
}

// Fallback initial state for Bus 31
const DEFAULT_BUS_31: BusTrackingState = {
  busId: 'veh-demo-a',
  busNumber: 'Bus 31',
  routeId: 'route-1',
  routeName: 'Route 1 — Mangalagiri Corridor',
  isSimulated: true,
  modeLabel: 'SIMULATED LIVE TRACKING — Demo Mode',
  isMoving: false,
  status: 'Stopped at Kaza',
  statusDescription: 'Stopped at Kaza (Departing in 02:15)',
  currentStopName: 'Kaza',
  nextStopName: 'Chinna Kakani',
  currentStop: { id: 'r1-s5', name: 'Kaza', x: 465, y: 205, lat: 16.4258, lng: 80.562, km: 18.4 },
  nextStop: { id: 'r1-s6', name: 'Chinna Kakani', x: 565, y: 235, lat: 16.439, lng: 80.569, km: 21.0 },
  etaMinutes: 4,
  speedKmph: 0,
  dwellRemainingSeconds: 135,
  dwellTotalSeconds: 150,
  coordinates: { x: 465, y: 205, lat: 16.4258, lng: 80.562 },
  direction: 'Outbound (Toward Mangalagiri)',
  lastUpdate: new Date().toISOString()
};

// Singleton centralized tracking store with listener pattern
// Prevents duplicate timers and guarantees seamless synchronization across all pages
let sharedTrackingState: LiveTrackingResponse | null = null;
let listeners: Array<(state: LiveTrackingResponse | null) => void> = [];
let pollingInterval: any = null;
let activeSubscriberCount = 0;

async function fetchAuthoritativeTracking() {
  try {
    const data = await api.getLiveTracking();
    if (data && data.success) {
      sharedTrackingState = data;
      listeners.forEach((listener) => listener(sharedTrackingState));
    }
  } catch (err) {
    console.warn('Live tracking polling error:', err);
  }
}

function startPolling() {
  if (!pollingInterval) {
    fetchAuthoritativeTracking();
    pollingInterval = setInterval(fetchAuthoritativeTracking, 2000);
  }
}

function stopPolling() {
  if (pollingInterval && activeSubscriberCount <= 0) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

export function useLiveTracking() {
  const [data, setData] = useState<LiveTrackingResponse | null>(sharedTrackingState);

  useEffect(() => {
    activeSubscriberCount++;
    startPolling();

    const listener = (updated: LiveTrackingResponse | null) => {
      setData(updated);
    };
    listeners.push(listener);

    if (sharedTrackingState) {
      setData(sharedTrackingState);
    }

    return () => {
      activeSubscriberCount--;
      listeners = listeners.filter((l) => l !== listener);
      stopPolling();
    };
  }, []);

  return {
    trackingData: data,
    bus31: data?.bus31 || DEFAULT_BUS_31,
    otherBuses: data?.otherBuses || [],
    allStops: data?.allStops || [],
    disclaimer: data?.disclaimer || 'SIMULATED LIVE TRACKING — Demo Mode. Vehicle movement is synthesized along the configured route geometry for hackathon demonstration. No physical GPS tracker hardware is connected.',
    isDemoMode: data?.bus31?.isSimulated ?? true
  };
}
