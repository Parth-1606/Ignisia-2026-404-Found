import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Activity, Clock, MapPin, Navigation, ShieldAlert, CheckCircle2, Zap, MousePointerClick, HeartPulse, Car, UserCheck } from 'lucide-react';
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

const ambulanceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/2.0.0/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const incidentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
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

type Patient = {
  id: string;
  lat: number;
  lng: number;
  vitals: { hr: number; bp: string; spo2: number; gcs: number };
  symptoms: string;
  predictedNeeds: string[];
  severity: 'Critical' | 'Urgent' | 'Stable';
  assignedHospitalId: string | null;
  routingRationale: string | null;
  eta: number | null; // minutes
};

// Mock Data
const INITIAL_HOSPITALS: Hospital[] = [
  { id: 'h1', name: 'General Hospital', lat: 40.7128, lng: -74.0060, level: 1, icuAvailable: 5, icuTotal: 20, ventsAvailable: 10, ventsTotal: 50, hasNeuro: true, hasCathLab: true, load: 75 },
  { id: 'h2', name: 'City Medical Center', lat: 40.7580, lng: -73.9855, level: 2, icuAvailable: 1, icuTotal: 20, ventsAvailable: 2, ventsTotal: 30, hasNeuro: false, hasCathLab: true, load: 95 },
  { id: 'h3', name: 'Regional Health', lat: 40.6782, lng: -73.9442, level: 3, icuAvailable: 8, icuTotal: 10, ventsAvailable: 5, ventsTotal: 15, hasNeuro: false, hasCathLab: false, load: 40 },
  { id: 'h4', name: 'University Hospital', lat: 40.8075, lng: -73.9626, level: 1, icuAvailable: 12, icuTotal: 50, ventsAvailable: 45, ventsTotal: 100, hasNeuro: true, hasCathLab: true, load: 60 },
];

const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'p1',
    lat: 40.7306,
    lng: -73.9866,
    vitals: { hr: 130, bp: '90/60', spo2: 88, gcs: 8 },
    symptoms: 'Severe head trauma, unresponsive',
    predictedNeeds: ['ICU', 'Ventilator', 'Neurosurgeon'],
    severity: 'Critical',
    assignedHospitalId: 'h4',
    routingRationale: 'General Hospital is closer but ICU is nearing capacity (75% load). University Hospital has ample ICU beds (12 avail), Ventilators, and on-duty Neurosurgeon. ETA: 12 mins.',
    eta: 12,
  }
];

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
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>('p1');
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  
  // Form State
  const [newPatient, setNewPatient] = useState({
    hr: 80, bp: '120/80', spo2: 98, gcs: 15, symptoms: '', lat: 40.7400, lng: -73.9900
  });

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Quick Scenarios for "Daily Use"
  const fillScenario = (type: 'cardiac' | 'trauma' | 'stable') => {
    if (type === 'cardiac') setNewPatient({ ...newPatient, hr: 145, bp: '90/60', spo2: 92, gcs: 14, symptoms: 'Severe chest pain, diaphoresis, suspected STEMI' });
    if (type === 'trauma') setNewPatient({ ...newPatient, hr: 130, bp: '80/50', spo2: 88, gcs: 7, symptoms: 'Multi-system trauma, MVA, unresponsive' });
    if (type === 'stable') setNewPatient({ ...newPatient, hr: 80, bp: '120/80', spo2: 99, gcs: 15, symptoms: 'Minor laceration to arm, bleeding controlled' });
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setNewPatient(prev => ({ ...prev, lat, lng }));
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setMapCenter([patient.lat, patient.lng]);
  };

  // Mock Prediction & Routing Engine
  const handleTriageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Severity Prediction (Mock)
    let severity: 'Critical' | 'Urgent' | 'Stable' = 'Stable';
    let needs: string[] = [];
    
    if (newPatient.gcs <= 8 || newPatient.spo2 < 90) {
      severity = 'Critical';
      needs.push('ICU', 'Ventilator');
      if (newPatient.symptoms.toLowerCase().includes('head') || newPatient.symptoms.toLowerCase().includes('stroke') || newPatient.symptoms.toLowerCase().includes('trauma')) {
        needs.push('Neurosurgeon');
      }
    } else if (newPatient.hr > 100 || newPatient.symptoms.toLowerCase().includes('chest')) {
      severity = 'Urgent';
      needs.push('Cath Lab');
    }

    // 2. Constraint-Based Routing (Mock)
    let bestHospital = null;
    let rationale = '';
    let eta = 0;

    if (isMassCasualty) {
      // Batch optimization logic: distribute load
      const availableHospitals = hospitals.filter(h => h.load < 90);
      bestHospital = availableHospitals.sort((a, b) => a.load - b.load)[0] || hospitals[0];
      rationale = `Mass Casualty Protocol Active: Routed to ${bestHospital.name} to distribute regional load. Facility has ${bestHospital.icuAvailable} ICU beds available.`;
      eta = Math.floor(Math.random() * 15) + 5;
    } else {
      // Single patient optimization
      if (needs.includes('Neurosurgeon')) {
        bestHospital = hospitals.find(h => h.hasNeuro && h.icuAvailable > 0 && h.load < 90) || hospitals.find(h => h.hasNeuro);
        rationale = `Patient requires Neurosurgeon. ${bestHospital?.name} selected due to specialist availability and acceptable ICU capacity.`;
      } else if (needs.includes('Cath Lab')) {
        bestHospital = hospitals.find(h => h.hasCathLab && h.load < 90) || hospitals[0];
        rationale = `Patient requires Cath Lab. ${bestHospital?.name} selected based on equipment availability and current load (${bestHospital?.load}%).`;
      } else {
        bestHospital = hospitals.sort((a, b) => a.load - b.load)[0];
        rationale = `Routed to ${bestHospital?.name} due to lowest current regional load (${bestHospital?.load}%).`;
      }
      eta = Math.floor(Math.random() * 10) + 5;
    }

    const newPatientRecord: Patient = {
      id: `p${Date.now().toString().slice(-4)}`,
      lat: newPatient.lat,
      lng: newPatient.lng,
      vitals: { hr: newPatient.hr, bp: newPatient.bp, spo2: newPatient.spo2, gcs: newPatient.gcs },
      symptoms: newPatient.symptoms,
      predictedNeeds: needs.length > 0 ? needs : ['Standard ED'],
      severity,
      assignedHospitalId: bestHospital?.id || null,
      routingRationale: rationale,
      eta,
    };

    setPatients([newPatientRecord, ...patients]);
    setSelectedPatientId(newPatientRecord.id);
    setMapCenter([newPatientRecord.lat, newPatientRecord.lng]);
    
    // Update hospital load (mock)
    if (bestHospital) {
      setHospitals(hospitals.map(h => 
        h.id === bestHospital.id 
          ? { ...h, load: Math.min(100, h.load + 5), icuAvailable: Math.max(0, h.icuAvailable - (needs.includes('ICU') ? 1 : 0)) } 
          : h
      ));
    }

    // Reset form slightly for next entry
    setNewPatient(prev => ({ ...prev, symptoms: '' }));
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3 text-sm text-blue-800">
                  <MousePointerClick className="h-5 w-5 text-blue-500 shrink-0 animate-pulse" />
                  <span className="flex-1">Click anywhere on the map to set the incident location.</span>
                </div>
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
                      <div className="text-xs text-gray-600 line-clamp-2 mb-2">{p.symptoms}</div>
                      <div className="text-xs font-semibold text-blue-700 flex items-center gap-1 bg-white/50 p-1.5 rounded border border-blue-100">
                        <Navigation className="h-3 w-3 shrink-0" />
                        <span className="truncate">To: {hospitals.find(h => h.id === p.assignedHospitalId)?.name || 'Pending'}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Map */}
        <div className="flex-1 relative z-0 bg-slate-100">
          <MapContainer center={[40.75, -73.98]} zoom={12} className="h-full w-full">
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

            {/* Patient Markers & Routes */}
            {patients.map(p => {
              const targetHospital = hospitals.find(h => h.id === p.assignedHospitalId);
              const isSelected = p.id === selectedPatientId;
              return (
                <React.Fragment key={p.id}>
                  <Marker position={[p.lat, p.lng]} icon={ambulanceIcon} zIndexOffset={isSelected ? 1000 : 0}>
                    <Popup>
                      <div className="font-bold">Unit {p.id}</div>
                      <div className="text-xs">{p.severity}</div>
                    </Popup>
                  </Marker>
                  {targetHospital && (
                    <Polyline 
                      positions={[[p.lat, p.lng], [targetHospital.lat, targetHospital.lng]]} 
                      color={isSelected ? "#2563eb" : "#94a3b8"}
                      weight={isSelected ? 5 : 3}
                      dashArray={isSelected ? "8, 12" : undefined}
                      className={isSelected ? "animate-pulse" : ""}
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

          {/* Live Hospital Grid */}
          <div className="p-5 flex-1 overflow-y-auto bg-white">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-red-500" />
              Live Regional Grid
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
