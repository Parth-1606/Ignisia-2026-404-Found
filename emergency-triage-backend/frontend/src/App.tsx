import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Activity, Clock, MapPin, Navigation, ShieldAlert, CheckCircle2, Zap, MousePointerClick, HeartPulse, Car, UserCheck, Crosshair, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { motion, AnimatePresence } from 'motion/react';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/2.0.0/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const idleAmbulanceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/2.0.0/images/marker-shadow.png',
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33]
});

const activeAmbulanceIcon = new L.DivIcon({
  className: 'ambulance-active-icon',
  html: `
    <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(239,68,68,0.25);animation:pulse-ring 1.5s ease-out infinite;"></div>
      <div style="position:absolute;width:30px;height:30px;border-radius:50%;background:rgba(239,68,68,0.15);"></div>
      <div style="position:relative;z-index:10;width:30px;height:30px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid #ef4444;display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;">🚑</div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});

const incidentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/2.0.0/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/2.0.0/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Types
type Hospital = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  level: number;
  icuAvailable: number;
  icuTotal: number;
  ventsAvailable: number;
  ventsTotal: number;
  hasNeuro: boolean;
  hasCathLab: boolean;
  load: number; // 0-100%
};

const fetchRoute = async (start: [number, number], end: [number, number]): Promise<[number, number][]> => {
  try {
    const url = 'https://router.project-osrm.org/route/v1/driving/' + start[1] + ',' + start[0] + ';' + end[1] + ',' + end[0] + '?overview=full&geometries=geojson';
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok') {
      return data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
    }
  } catch (e) {
    console.error('OSRM route fetch error:', e);
  }
  return [start, end];
};

type Patient = {
  id: string;
  lat: number;
  lng: number;
  ambulanceLat: number;
  ambulanceLng: number;
  dispatchedUnit: string;
  routeToPatient: [number, number][];
  routeToHospital: [number, number][];
  currentRoutePhase: 'TO_PATIENT' | 'TO_HOSPITAL' | 'ARRIVED';
  currentRouteIndex: number;
  vitals: { hr: number; bp: string; spo2: number; gcs: number };
  symptoms: string;
  predictedNeeds: string[];
  severity: 'Critical' | 'Urgent' | 'Stable';
  assignedHospitalId: string | null;
  routingRationale: string | null;
  eta: number | null; // minutes
};

// Initial state starts empty
const INITIAL_HOSPITALS: Hospital[] = [];
const INITIAL_PATIENTS: Patient[] = [];

const generateAmbulances = (centerLat: number, centerLng: number) => {
  const names = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];
  return Array.from({length: 8}).map((_, i) => ({
    id: 'AMB-' + names[i],
    lat: centerLat + (Math.random() - 0.5) * 0.04,
    lng: centerLng + (Math.random() - 0.5) * 0.04,
  }));
};

// Helper to map backend format
const mapHospital = (h: any): Hospital => ({
  id: h.id,
  name: h.name,
  lat: parseFloat(h.latitude),
  lng: parseFloat(h.longitude),
  level: h.trauma_level || 1,
  icuAvailable: h.icu_beds_available || 0,
  icuTotal: h.icu_beds_total || 0,
  ventsAvailable: h.ventilators_available || 0,
  ventsTotal: h.ventilators_total || 0,
  hasNeuro: h.has_stroke_center || false,
  hasCathLab: h.has_cath_lab || false,
  load: h.current_load_percent || 0,
});

// Map Helper Components
function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function App() {
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [isMassCasualty, setIsMassCasualty] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [liveUpdates, setLiveUpdates] = useState<{id: string; text: string; time: string; type: 'up' | 'down'}[]>([]);
  const [availableAmbulances, setAvailableAmbulances] = useState<{id: string; lat: number; lng: number}[]>([]);

  useEffect(() => {
     setAvailableAmbulances(generateAmbulances(18.5204, 73.8567));
  }, []);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/hospitals');
        const data = await res.json();
        if (data.success) {
          setHospitals(data.data.map(mapHospital));
        }
      } catch (e) {
        console.error('Error fetching hospitals', e);
      }
    };
    
    fetchHospitals();

    // Setup WebSocket with auto-reconnect
    let ws: WebSocket;
    let reconnectTimeout: any;

    const connectWS = () => {
      ws = new WebSocket('ws://localhost:3000/ws');
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'HOSPITAL_CAPACITY_UPDATED') {
            // Update the specific hospital inline (no full refetch needed)
            setHospitals(prev => prev.map(h => {
              if (String(h.id) === String(data.hospitalId)) {
                return {
                  ...h,
                  icuAvailable: data.changes.icu_beds_available.to,
                  ventsAvailable: data.changes.ventilators_available.to,
                  load: data.changes.current_load_percent.to,
                };
              }
              return h;
            }));

            // Add to live activity feed
            const loadChange = data.changes.current_load_percent.to - data.changes.current_load_percent.from;
            const feedEntry = {
              id: `${Date.now()}-${data.hospitalId}`,
              text: `${data.hospitalName}: ${data.event} (Load ${loadChange > 0 ? '+' : ''}${loadChange}%)`,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              type: (loadChange > 0 ? 'up' : 'down') as 'up' | 'down',
            };
            setLiveUpdates(prev => [feedEntry, ...prev].slice(0, 8));
          }

          if (data.type === 'DISPATCH_COMPLETE') {
            fetchHospitals(); // Full refresh after a dispatch
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        // Auto-reconnect after 3 seconds
        reconnectTimeout = setTimeout(connectWS, 3000);
      };

      ws.onerror = () => ws.close();
    };

    connectWS();

    return () => {
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, []);

  // Animation Engine for Ambulances
  useEffect(() => {
    const timer = setInterval(() => {
      setPatients(prev => {
        let changed = false;
        const next = prev.map(p => {
          if (p.currentRoutePhase === 'ARRIVED') return p;
          changed = true;
          
          const SPEED = 0.0003; // Distance to move per 100ms tick (~30 meters)
          const targetRoute = p.currentRoutePhase === 'TO_PATIENT' ? p.routeToPatient : p.routeToHospital;
          
          let curLat = p.ambulanceLat;
          let curLng = p.ambulanceLng;
          let currentIndex = p.currentRouteIndex;
          
          if (!targetRoute || targetRoute.length === 0) {
            return { ...p, currentRoutePhase: 'ARRIVED' as const };
          }

          // Follow the path coordinates array
          while (currentIndex < targetRoute.length) {
            const nextP = targetRoute[currentIndex];
            const dLat = nextP[0] - curLat;
            const dLng = nextP[1] - curLng;
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            
            if (dist > SPEED) {
              curLat += (dLat / dist) * SPEED;
              curLng += (dLng / dist) * SPEED;
              break; // Moved slightly towards next node
            } else {
              // Overshot the node, snap to it and target the next node on next loop
              curLat = nextP[0];
              curLng = nextP[1];
              currentIndex++;
            }
          }

          if (currentIndex >= targetRoute.length) {
            // End of route reached
            if (p.currentRoutePhase === 'TO_PATIENT') {
              return {
                ...p,
                ambulanceLat: p.lat,
                ambulanceLng: p.lng,
                currentRoutePhase: (p.assignedHospitalId ? 'TO_HOSPITAL' : 'ARRIVED') as 'TO_PATIENT' | 'TO_HOSPITAL' | 'ARRIVED',
                currentRouteIndex: 0
              };
            } else {
              const targetHospital = hospitals.find(h => h.id === p.assignedHospitalId);
              return {
                ...p,
                ambulanceLat: targetHospital?.lat || p.lat,
                ambulanceLng: targetHospital?.lng || p.lng,
                currentRoutePhase: 'ARRIVED' as const
              };
            }
          }

          return {
             ...p,
             ambulanceLat: curLat,
             ambulanceLng: curLng,
             currentRouteIndex: currentIndex
          };
        });
        return changed ? next : prev;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [hospitals]);
  
  // Form State
  const [newPatient, setNewPatient] = useState({
    hr: 80, bp: '120/80', spo2: 98, gcs: 15, symptoms: '', lat: 18.5204, lng: 73.8567
  });

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Quick Scenarios — pulls real vitals from the 200K patient dataset
  const fillScenario = async (type: 'cardiac' | 'trauma' | 'stable') => {
    try {
      const risk = type === 'stable' ? 'Low Risk' : 'High Risk';
      const res = await fetch(`http://localhost:3000/api/patients/vitals/random?risk=${encodeURIComponent(risk)}`);
      const data = await res.json();
      if (data.success && data.data) {
        const v = data.data;
        const symptoms = type === 'cardiac'
          ? 'Severe chest pain, diaphoresis, suspected STEMI'
          : type === 'trauma'
          ? 'Multi-system trauma, MVA, unresponsive'
          : 'Minor laceration, bleeding controlled';
        setNewPatient({
          ...newPatient,
          hr: v.heart_rate,
          bp: `${v.systolic_bp}/${v.diastolic_bp}`,
          spo2: v.spo2,
          gcs: type === 'trauma' ? 7 : type === 'cardiac' ? 13 : 15,
          symptoms,
        });
      }
    } catch (e) {
      // Fallback to hardcoded if backend is down
      if (type === 'cardiac') setNewPatient({ ...newPatient, hr: 145, bp: '90/60', spo2: 92, gcs: 14, symptoms: 'Severe chest pain, diaphoresis, suspected STEMI' });
      if (type === 'trauma') setNewPatient({ ...newPatient, hr: 130, bp: '80/50', spo2: 88, gcs: 7, symptoms: 'Multi-system trauma, MVA, unresponsive' });
      if (type === 'stable') setNewPatient({ ...newPatient, hr: 80, bp: '120/80', spo2: 99, gcs: 15, symptoms: 'Minor laceration to arm, bleeding controlled' });
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setNewPatient(prev => ({ ...prev, lat, lng }));
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setMapCenter([patient.lat, patient.lng]);
  };

  // GPS Location
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setNewPatient(prev => ({ ...prev, lat: latitude, lng: longitude }));
        setUserLocation([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location permission denied. Please allow location access in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            alert('Location request timed out. Please try again.');
            break;
          default:
            alert('An unknown error occurred while getting your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Connect to Backend Prediction & Routing Engine
  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let systolic_bp = 120, diastolic_bp = 80;
    if (newPatient.bp && newPatient.bp.includes('/')) {
      const parts = newPatient.bp.split('/');
      systolic_bp = parseInt(parts[0]) || 120;
      diastolic_bp = parseInt(parts[1]) || 80;
    }

    const payload = {
      incident_id: `INC-${Date.now().toString().slice(-6)}`,
      age: 45, // default
      gender: "unknown",
      heart_rate: newPatient.hr,
      systolic_bp,
      diastolic_bp,
      respiratory_rate: 16,
      temperature: 37.0,
      spo2: newPatient.spo2,
      gcs_score: newPatient.gcs,
      symptoms: newPatient.symptoms ? newPatient.symptoms.split(',').map(s => s.trim()) : [],
      incident_latitude: newPatient.lat,
      incident_longitude: newPatient.lng,
    };

    try {
      const res = await fetch(`http://localhost:3000/api/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        const { prediction, routing } = data.data;
        const bestHospital = routing?.optimal?.hospital;
        
        // Map Backend severity
        let severityClass = 'Stable';
        const rawSeverity = prediction.severityLevel || 'stable';
        if (rawSeverity.toLowerCase() === 'critical') severityClass = 'Critical';
        if (rawSeverity.toLowerCase() === 'urgent' || rawSeverity.toLowerCase() === 'high') severityClass = 'Urgent';

        // Find nearest available ambulance
        let nearestAmb = availableAmbulances.length > 0 ? availableAmbulances[0] : null;
        let minDist = Infinity;
        availableAmbulances.forEach(a => {
          const d = Math.sqrt(Math.pow(a.lat - newPatient.lat, 2) + Math.pow(a.lng - newPatient.lng, 2));
          if (d < minDist) {
            minDist = d;
            nearestAmb = a;
          }
        });

        const ambLat = nearestAmb ? nearestAmb.lat : newPatient.lat + (Math.random() - 0.5) * 0.05;
        const ambLng = nearestAmb ? nearestAmb.lng : newPatient.lng + (Math.random() - 0.5) * 0.05;

        // Fetch Google Maps style route coords
        const routeToPatient = await fetchRoute([ambLat, ambLng], [newPatient.lat, newPatient.lng]);
        const routeToHospital = bestHospital 
          ? await fetchRoute([newPatient.lat, newPatient.lng], [bestHospital.lat, bestHospital.lng]) 
          : [];

        // Remove the dispatched ambulance from available pool
        if (nearestAmb) {
          setAvailableAmbulances(prev => prev.filter(a => a.id !== nearestAmb.id));
        }

        const newPatientRecord: Patient = {
          id: data.data.incidentId || payload.incident_id,
          lat: newPatient.lat,
          lng: newPatient.lng,
          ambulanceLat: ambLat,
          ambulanceLng: ambLng,
          dispatchedUnit: nearestAmb ? nearestAmb.id : 'AMB-Auto',
          routeToPatient,
          routeToHospital,
          currentRoutePhase: 'TO_PATIENT',
          currentRouteIndex: 0,
          vitals: { hr: newPatient.hr, bp: newPatient.bp, spo2: newPatient.spo2, gcs: newPatient.gcs },
          symptoms: newPatient.symptoms,
          predictedNeeds: [
            ...(prediction.predictedCareNeeds?.equipment || []),
            prediction.predictedCareNeeds?.specialist
          ].filter(Boolean) as string[],
          severity: severityClass as any,
          assignedHospitalId: bestHospital?.id || null,
          routingRationale: data.data.rationale || 'Backend rationale unavailable',
          eta: routing?.optimal?.transitMinutes || 0,
        };

        setPatients(prev => [newPatientRecord, ...prev]);
        setSelectedPatientId(newPatientRecord.id);
        setMapCenter([newPatientRecord.lat, newPatientRecord.lng]);
        setNewPatient(prev => ({ ...prev, symptoms: '' }));
        
        // Refresh hospitals to get updated load/capacity
        const hRes = await fetch('http://localhost:3000/api/hospitals');
        const hData = await hRes.json();
        if (hData.success) {
          setHospitals(hData.data.map(mapHospital));
        }
      } else {
        alert('Dispatch failed: ' + data.error);
      }
    } catch (err) {
      console.error('API Error:', err);
      alert('Failed to connect to backend routing engine.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Activity className="text-red-500 h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">GoldenHour Dispatch</h1>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
            <span className="text-sm font-medium text-slate-300">Mass Casualty Protocol</span>
            <button 
              onClick={() => setIsMassCasualty(!isMassCasualty)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${isMassCasualty ? 'bg-red-500' : 'bg-slate-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMassCasualty ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="text-sm bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-2">
            <span className="text-slate-400">Active Units:</span>
            <span className="font-bold text-red-400 text-lg leading-none">{patients.length}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Triage Input */}
        <div className="w-[380px] bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 shrink-0">
          
          <div className="p-4 border-b bg-slate-50">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-amber-500" />
              Quick Scenarios
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fillScenario('cardiac')} className="text-xs h-auto py-2 flex flex-col gap-1 border-red-200 hover:bg-red-50 hover:text-red-700">
                <HeartPulse className="h-4 w-4 text-red-500" />
                Cardiac
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fillScenario('trauma')} className="text-xs h-auto py-2 flex flex-col gap-1 border-orange-200 hover:bg-orange-50 hover:text-orange-700">
                <Car className="h-4 w-4 text-orange-500" />
                Trauma
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fillScenario('stable')} className="text-xs h-auto py-2 flex flex-col gap-1 border-green-200 hover:bg-green-50 hover:text-green-700">
                <UserCheck className="h-4 w-4 text-green-500" />
                Stable
              </Button>
            </div>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            <form onSubmit={handleTriageSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="symptoms" className="text-sm font-semibold">Reported Symptoms</Label>
                <Input 
                  id="symptoms" 
                  placeholder="e.g., Severe chest pain, shortness of breath" 
                  value={newPatient.symptoms}
                  onChange={e => setNewPatient({...newPatient, symptoms: e.target.value})}
                  required
                  className="bg-gray-50"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border">
                <div className="space-y-1">
                  <Label htmlFor="hr" className="text-xs font-semibold text-slate-600">Heart Rate</Label>
                  <div className="flex items-center gap-2">
                    <Input id="hr" type="number" value={newPatient.hr} onChange={e => setNewPatient({...newPatient, hr: parseInt(e.target.value)})} className="h-8" />
                    <span className="text-xs text-slate-400 w-8">bpm</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bp" className="text-xs font-semibold text-slate-600">Blood Pressure</Label>
                  <div className="flex items-center gap-2">
                    <Input id="bp" value={newPatient.bp} onChange={e => setNewPatient({...newPatient, bp: e.target.value})} className="h-8" />
                    <span className="text-xs text-slate-400 w-8">mmHg</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="spo2" className="text-xs font-semibold text-slate-600">SpO2</Label>
                  <div className="flex items-center gap-2">
                    <Input id="spo2" type="number" value={newPatient.spo2} onChange={e => setNewPatient({...newPatient, spo2: parseInt(e.target.value)})} className="h-8" />
                    <span className="text-xs text-slate-400 w-8">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="gcs" className="text-xs font-semibold text-slate-600">GCS Score</Label>
                  <div className="flex items-center gap-2">
                    <Input id="gcs" type="number" min="3" max="15" value={newPatient.gcs} onChange={e => setNewPatient({...newPatient, gcs: parseInt(e.target.value)})} className="h-8" />
                    <span className="text-xs text-slate-400 w-8">/15</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" /> 
                  Incident Location
                </Label>
                <div className="flex gap-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3 text-sm text-blue-800 flex-1">
                    <MousePointerClick className="h-5 w-5 text-blue-500 shrink-0 animate-pulse" />
                    <span className="flex-1 text-xs">Click map or use GPS</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseGPS}
                    disabled={gpsLoading}
                    className="h-auto px-3 py-2 flex flex-col items-center gap-1 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-emerald-600 shrink-0"
                  >
                    {gpsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Crosshair className="h-5 w-5" />
                    )}
                    <span className="text-[10px] font-semibold">{gpsLoading ? 'Locating...' : 'Use GPS'}</span>
                  </Button>
                </div>
                {userLocation && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center gap-2 text-xs text-emerald-700">
                    <Crosshair className="h-3.5 w-3.5 shrink-0" />
                    <span>GPS location acquired: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 opacity-50 pointer-events-none">
                  <Input value={newPatient.lat.toFixed(4)} readOnly className="h-8 text-xs bg-gray-100" />
                  <Input value={newPatient.lng.toFixed(4)} readOnly className="h-8 text-xs bg-gray-100" />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md">
                <Navigation className="mr-2 h-4 w-4" />
                Predict Needs & Route Unit
              </Button>
            </form>

            <div className="mt-8">
              <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Active Transports
              </h3>
              <div className="space-y-3">
                <AnimatePresence>
                  {patients.map(p => (
                    <motion.div 
                      key={p.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handlePatientSelect(p)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${selectedPatientId === p.id ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-400' : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-slate-800">Unit {p.id}</span>
                        <Badge variant={p.severity === 'Critical' ? 'destructive' : p.severity === 'Urgent' ? 'warning' : 'success'} className="shadow-sm">
                          {p.severity}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-2 mb-3">{p.symptoms}</div>
                      <div className="text-[11px] font-semibold text-blue-700 flex items-center gap-1.5 bg-blue-50/50 p-2 rounded-md border border-blue-200 shadow-sm">
                        <Navigation className="h-3 w-3 shrink-0" />
                        <span className="truncate">To: {hospitals.find(h => h.id === p.assignedHospitalId)?.name || 'Pending'}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Available Ambulances Nearby */}
            <div className="mt-8 border-t pt-5">
              <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Car className="h-4 w-4" />
                Available Units Nearby
              </h3>
              <div className="space-y-2">
                {availableAmbulances.slice().sort((a, b) => {
                  const distA = Math.sqrt(Math.pow(a.lat - newPatient.lat, 2) + Math.pow(a.lng - newPatient.lng, 2));
                  const distB = Math.sqrt(Math.pow(b.lat - newPatient.lat, 2) + Math.pow(b.lng - newPatient.lng, 2));
                  return distA - distB;
                }).map(a => {
                  const dist = Math.sqrt(Math.pow(a.lat - newPatient.lat, 2) + Math.pow(a.lng - newPatient.lng, 2));
                  const eta = Math.max(1, Math.round(dist * 111 * 1.5)); // rough simulation
                  return (
                    <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center hover:bg-slate-50 transition-colors shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-1.5 rounded-lg shadow-sm text-base">🚑</div>
                        <div>
                          <div className="font-bold text-sm text-slate-800">{a.id}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{eta} min away</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50 font-semibold shadow-sm">Available</Badge>
                    </div>
                  );
                })}
                {availableAmbulances.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-400 border border-dashed rounded-lg">No idle units available.</div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Center - Map */}
        <div className="flex-1 relative z-0 bg-slate-100">
          <MapContainer center={[18.5204, 73.8567]} zoom={12} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            
            <MapEvents onLocationSelect={handleLocationSelect} />
            <MapController center={mapCenter} />
            
            {/* New Incident Marker (Preview) */}
            <Marker position={[newPatient.lat, newPatient.lng]} icon={incidentIcon} opacity={0.7}>
              <Popup>New Incident Location</Popup>
            </Marker>

            {/* User GPS Location Marker */}
            {userLocation && (
              <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={500}>
                <Popup>
                  <div className="font-bold text-sm text-emerald-700">📍 Your Location</div>
                  <div className="text-xs text-gray-500">{userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}</div>
                </Popup>
              </Marker>
            )}

            {/* Hospital Markers */}
            {hospitals.map(h => (
              <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}>
                <Popup className="rounded-lg">
                  <div className="font-bold text-sm mb-1">{h.name}</div>
                  <div className="text-xs text-gray-600 mb-2">Level {h.level} Trauma Center</div>
                  <div className="space-y-1 text-xs bg-slate-50 p-2 rounded border">
                    <div className="flex justify-between">
                      <span>ICU Beds:</span>
                      <span className="font-semibold">{h.icuAvailable}/{h.icuTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ventilators:</span>
                      <span className="font-semibold">{h.ventsAvailable}/{h.ventsTotal}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t mt-1">
                      <span>Current Load:</span>
                      <span className={`font-bold ${h.load > 90 ? 'text-red-600' : h.load > 70 ? 'text-amber-600' : 'text-green-600'}`}>{h.load}%</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Available Ambulances - Tiny green markers */}
            {availableAmbulances.map(a => {
              const dist = Math.sqrt(Math.pow(a.lat - newPatient.lat, 2) + Math.pow(a.lng - newPatient.lng, 2));
              const eta = Math.max(1, Math.round(dist * 111 * 1.5));
              return (
                <Marker key={a.id} position={[a.lat, a.lng]} icon={idleAmbulanceIcon} zIndexOffset={600}>
                  <Popup>
                    <div style={{minWidth: 140}}>
                      <div className="font-bold text-sm">🚑 {a.id}</div>
                      <div className="text-xs text-gray-600 mt-1">Status: <span className="text-green-600 font-semibold">Available</span></div>
                      <div className="text-xs mt-1">ETA to you: <strong className="text-blue-600">{eta} min</strong></div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Patient Markers & Routes */}
            {patients.map(p => {
              const targetHospital = hospitals.find(h => h.id === p.assignedHospitalId);
              const isSelected = p.id === selectedPatientId;
              return (
                <React.Fragment key={p.id}>
                  {/* Mark the incident location where patient is waiting */}
                  <Marker position={[p.lat, p.lng]} icon={incidentIcon} opacity={0.6}>
                    <Popup>
                      <div className="font-bold">Incident {p.id}</div>
                      <div className="text-xs">Waiting for Unit</div>
                    </Popup>
                  </Marker>
                  
                  {/* The actual moving Ambulance */}
                  <Marker position={[p.ambulanceLat, p.ambulanceLng]} icon={activeAmbulanceIcon} zIndexOffset={isSelected ? 1000 : 800}>
                    <Popup>
                      <div className="font-bold">Unit {p.id}</div>
                      <div className="text-xs">{p.severity}</div>
                    </Popup>
                  </Marker>
                  
                  {/* Route from Ambulance to Patient */}
                  {p.currentRoutePhase === 'TO_PATIENT' && p.routeToPatient.length > 0 && (
                    <Polyline 
                      positions={p.routeToPatient} 
                      color="#3b82f6" // Bright Blue like Google Maps
                      weight={5}
                      opacity={0.8}
                      dashArray="10 15"
                      className="animate-flow drop-shadow-md"
                    />
                  )}

                  {/* Route from Patient to Hospital */}
                  {(p.currentRoutePhase === 'TO_PATIENT' || p.currentRoutePhase === 'TO_HOSPITAL') && targetHospital && p.routeToHospital.length > 0 && (
                    <Polyline 
                      positions={p.routeToHospital} 
                      color="#8b5cf6" 
                      weight={5}
                      opacity={0.6}
                      dashArray="10 15"
                      className="animate-flow drop-shadow-md"
                    />
                  )}
                </React.Fragment>
              );
            })}
          </MapContainer>
          
          {/* Map Overlay Hint */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-slate-200 text-sm font-medium text-slate-700 flex items-center gap-2 pointer-events-none">
            <MousePointerClick className="h-4 w-4 text-blue-500" />
            Click map to set incident location
          </div>
        </div>

        {/* Right Sidebar - Routing Explainability & Hospital Status */}
        <div className="w-[400px] bg-white border-l border-gray-200 flex flex-col shadow-sm z-10 shrink-0">
          
          {/* Explainability Panel */}
          <div className="p-5 border-b border-gray-200 bg-slate-50 flex-1 overflow-y-auto">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-5">
              <Navigation className="h-5 w-5 text-blue-600" />
              Routing Intelligence
            </h2>
            
            <AnimatePresence mode="wait">
              {selectedPatient ? (
                <motion.div 
                  key={selectedPatient.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <Card className="border-blue-100 shadow-md overflow-hidden">
                    <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                      <CardTitle className="text-sm flex justify-between items-center">
                        <span className="font-bold text-blue-900">Predicted Care Needs</span>
                        <Badge variant="outline" className="bg-white shadow-sm">{selectedPatient.severity}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedPatient.predictedNeeds.map((need, i) => (
                          <Badge key={i} variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 px-3 py-1">
                            {need}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dispatched Unit ETA to Scene */}
                  <Card className="border-indigo-200 shadow-md overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                      <CardTitle className="text-sm flex items-center gap-2 text-indigo-900">
                        <Car className="h-5 w-5 text-indigo-600" />
                        Dispatched Rescue Unit
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex justify-between items-start bg-white p-3 rounded-lg border border-indigo-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-4 relative z-10 w-full">
                          <div className="text-4xl relative">
                            🚑
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{selectedPatient.dispatchedUnit}</div>
                            <div className="font-bold text-lg text-slate-800 line-clamp-1 flex items-center gap-1">
                              ALS Responder
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black text-indigo-600 flex items-center justify-end">
                              {Math.max(1, Math.round(Math.sqrt(Math.pow(selectedPatient.lat - selectedPatient.ambulanceLat, 2) + Math.pow(selectedPatient.lng - selectedPatient.ambulanceLng, 2)) * 111 * 1.5))}
                              <span className="text-sm ml-1 text-slate-500 mt-1">min</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ETA to Scene</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 shadow-md overflow-hidden">
                    <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                      <CardTitle className="text-sm flex items-center gap-2 text-green-900">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Optimal Destination
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex justify-between items-start bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                        <div className="font-bold text-lg text-slate-800">
                          {hospitals.find(h => h.id === selectedPatient.assignedHospitalId)?.name}
                        </div>
                        <div className="flex items-center text-green-700 font-bold bg-green-100 px-3 py-1.5 rounded-md text-sm shadow-sm">
                          <Clock className="h-4 w-4 mr-1.5" />
                          {selectedPatient.eta} min
                        </div>
                      </div>
                      
                      <div className="bg-slate-800 p-4 rounded-lg text-sm text-slate-300 leading-relaxed shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <span className="font-bold block mb-2 text-white flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-400" />
                          Constraint Engine Rationale:
                        </span>
                        {selectedPatient.routingRationale}
                      </div>

                      {/* Navigate via Google Maps */}
                      {(() => {
                        const assignedHospital = hospitals.find(h => h.id === selectedPatient.assignedHospitalId);
                        if (!assignedHospital) return null;
                        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${selectedPatient.lat},${selectedPatient.lng}&destination=${assignedHospital.lat},${assignedHospital.lng}&travelmode=driving`;
                        return (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Navigation className="h-5 w-5" />
                            Navigate via Google Maps
                            <ExternalLink className="h-4 w-4 ml-1 opacity-70" />
                          </a>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-400 py-12 flex flex-col items-center bg-white rounded-xl border border-dashed border-gray-200"
                >
                  <MapPin className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="font-medium">Select a unit to view routing rationale.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Live Activity Feed */}
          {liveUpdates.length > 0 && (
            <div className="px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-slate-900 to-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                Live Updates
              </h3>
              <div className="space-y-1 max-h-[120px] overflow-y-auto">
                <AnimatePresence>
                  {liveUpdates.map((u) => (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-[11px]"
                    >
                      <span className="text-slate-500 font-mono shrink-0">{u.time}</span>
                      <span className={`shrink-0 text-base ${u.type === 'up' ? '🔺' : '🔻'}`}>
                        {u.type === 'up' ? '▲' : '▼'}
                      </span>
                      <span className={`truncate ${u.type === 'up' ? 'text-red-400' : 'text-green-400'}`}>
                        {u.text}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Live Hospital Grid */}
          <div className="p-5 flex-1 overflow-y-auto bg-white">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-red-500" />
              Live Regional Grid
              <span className="ml-auto text-xs text-slate-400 font-normal">{hospitals.length} hospitals</span>
            </h2>
            
            <div className="space-y-3">
              {hospitals.map(h => (
                <div key={h.id} className="border border-slate-200 rounded-xl p-4 text-sm shadow-sm hover:shadow-md transition-shadow bg-slate-50/50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-slate-800">{h.name}</span>
                    <Badge variant={h.load > 90 ? 'destructive' : h.load > 70 ? 'warning' : 'success'} className="shadow-sm">
                      {h.load}% Load
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 mb-3 bg-white p-2 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${h.icuAvailable > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-medium">ICU: {h.icuAvailable}/{h.icuTotal}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${h.ventsAvailable > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-medium">Vents: {h.ventsAvailable}/{h.ventsTotal}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {h.hasNeuro && <Badge variant="outline" className="text-[10px] py-0 h-5 bg-white">Neuro</Badge>}
                    {h.hasCathLab && <Badge variant="outline" className="text-[10px] py-0 h-5 bg-white">Cath Lab</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
