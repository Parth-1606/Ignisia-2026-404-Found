import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Hospital, 
  Ambulance, 
  Navigation, 
  BarChart3, 
  Settings, 
  Info, 
  Search, 
  Bell, 
  Clock, 
  MapPin, 
  AlertTriangle,
  ChevronRight,
  Activity,
  Star,
  CheckCircle2,
  Phone,
  RotateCcw,
  ChevronDown,
  Building2,
  User,
  Users,
  Shield,
  History,
  LogOut,
  ExternalLink,
  CreditCard,
  Smartphone,
  HeartPulse,
  Brain,
  Droplets,
  UserX,
  Flame,
  ArrowLeft
} from 'lucide-react';
import { useState, useEffect } from 'react';

// --- Types ---
type View = 'landing' | 'dashboard' | 'hospitals' | 'settings' | 'userRoles' | 'manual' | 'about';

interface Emergency {
  id: string;
  severity: string;
  location: string;
  time: string;
  hospitalName?: string;
  hospitalLat?: number;
  hospitalLng?: number;
  matchScore?: number;
  eta?: string;
  reasons?: string[];
  patientLat?: number;
  patientLng?: number;
}

interface User {
  name: string;
  email: string;
  avatar?: string;
  initials?: string;
  age: string;
  bloodGroup: string;
  syncLayouts: boolean;
  showStatusBar: boolean;
}

interface HospitalData {
  id: string | number;
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
  load: number;
  address?: string;
  distance?: string;
  distanceVal?: number;
  driveTime?: string;
  waitTime?: string;
  waitTimeVal?: number;
  beds?: string;
  bedsVal?: number;
  bedPercent?: number;
}

// --- Sidebar Component ---
const Sidebar = ({ currentView, setView }: { currentView: View, setView: (v: View) => void }) => {
  const menuItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Home', id: 'landing' as View },
    { icon: <Activity className="w-5 h-5" />, label: 'Dashboard', id: 'dashboard' as View },
    { icon: <Hospital className="w-5 h-5" />, label: 'Hospitals', id: 'hospitals' as View },
    { icon: <Users className="w-5 h-5" />, label: 'User Roles', id: 'userRoles' as View },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', id: 'settings' as View },
    { icon: <Info className="w-5 h-5" />, label: 'About Us', id: 'about' },
  ];

  return (
    <div className="w-64 h-screen border-r border-white/5 flex flex-col p-6 fixed left-0 top-0 bg-dark-bg z-20">
      <div className="flex items-center gap-3 mb-12 cursor-pointer" onClick={() => setView('landing')}>
        <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.3)]">
          <Activity className="text-black w-6 h-6" />
        </div>
        <span className="text-xl font-display font-bold tracking-tight text-gold">Golden Root</span>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4 px-3">Main Menu</p>
        {menuItems.map((item, i) => (
          <button 
            key={i} 
            onClick={() => {
              if (item.id === 'landing' || item.id === 'dashboard' || item.id === 'hospitals' || item.id === 'settings' || item.id === 'userRoles' || item.id === 'about') {
                setView(item.id as View);
              }
            }}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group w-full text-left ${
              currentView === item.id ? 'bg-gold/10 text-gold' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto p-4 glass rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold">
            <Star className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold">Pro Dispatcher</p>
        </div>
        <p className="text-[10px] text-white/40">You are currently in high-priority mode.</p>
      </div>
    </div>
  );
};

// --- Active Emergencies List ---
const ActiveEmergencies = ({ emergencies }: { emergencies: Emergency[] }) => {
  const displayEmergencies = emergencies.length > 0 ? emergencies : [
    { id: 'PAT-9921', severity: 'Critical', location: '4th Ave, Block C', time: '04:12' },
    { id: 'PAT-8832', severity: 'Moderate', location: 'St. Peter Square', time: '08:45' },
    { id: 'PAT-7741', severity: 'Critical', location: 'Industrial Zone', time: '02:30' },
  ];

  return (
    <div className="glass rounded-3xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-display font-bold">Active Emergencies List</h3>
        <div className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase animate-pulse">
          Live Feed
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        {displayEmergencies.map((e, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-white/80">{e.id}</span>
              <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                e.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
              }`}>
                {e.severity}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/40">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{e.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gold">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-mono font-bold">{e.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Recommended Hospital ---
const RecommendedHospital = ({ emergency }: { emergency: Emergency | null }) => {
  const defaultRec = {
    hospitalName: "St. Mary's Trauma Center",
    eta: "12 mins",
    matchScore: 98,
    reasons: [
      'Specialized Cardiac Unit available',
      'Lowest current ER wait time (2m)',
      'Optimal ambulance route cleared',
      'Patient history on file'
    ]
  };

  const rec = emergency && emergency.hospitalName ? {
    hospitalName: emergency.hospitalName,
    eta: emergency.eta || "Calculated...",
    matchScore: emergency.matchScore || 95,
    reasons: emergency.reasons || defaultRec.reasons
  } : defaultRec;

  return (
    <div className="glass rounded-3xl p-8 gold-glow border-gold/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-display font-bold">Recommended Hospital</h3>
          <p className="text-xs text-gold/60 font-bold uppercase tracking-wider">Top Choice for PAT-9921</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <p className="text-[10px] text-white/30 font-bold uppercase mb-1">Hospital Name</p>
            <p className="text-2xl font-bold">{rec.hospitalName}</p>
          </div>
          
          <div className="flex gap-12">
            <div>
              <p className="text-[10px] text-white/30 font-bold uppercase mb-1">ETA</p>
              <p className="text-2xl font-bold text-gold">{rec.eta}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 font-bold uppercase mb-1">Match Score</p>
              <p className="text-2xl font-bold">{rec.matchScore}%</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[10px] text-white/30 font-bold uppercase mb-3">Reason for Recommendation</p>
          <ul className="space-y-3">
            {rec.reasons.map((reason, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                <div className="w-1 h-1 rounded-full bg-gold" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// --- Mini Map Preview ---
const MiniMapPreview = ({ activeEmergency }: { activeEmergency: Emergency | null }) => {
  // Mapping GPS to visual coordinates on our stylized grid
  // Pune area roughly 18.4 to 18.6 Lat, 73.7 to 73.9 Lng
  const mapCoords = (lat?: number, lng?: number) => {
    if (!lat || !lng) return { x: 50, y: 50 };
    const x = ((lng - 73.7) / 0.2) * 100;
    const y = (1 - (lat - 18.4) / 0.2) * 100;
    return { x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) };
  };

  const patientLoc = mapCoords(activeEmergency?.patientLat, activeEmergency?.patientLng);
  const hospitalLoc = mapCoords(activeEmergency?.hospitalLat, activeEmergency?.hospitalLng);

  return (
    <div className="glass rounded-3xl p-6 h-full flex flex-col">
      <h3 className="text-xl font-display font-bold mb-6">Live Tactical Network</h3>
      
      <div className="flex-1 rounded-2xl bg-[#080808] relative overflow-hidden border border-white/5">
        {/* Animated Map visualization */}
        <svg className="absolute inset-0 w-full h-full">
          {activeEmergency && (
            <motion.path
              d={`M ${patientLoc.x} ${patientLoc.y} Q ${(patientLoc.x + hospitalLoc.x)/2} ${(patientLoc.y + hospitalLoc.y)/2 - 10} ${hospitalLoc.x} ${hospitalLoc.y}`}
              fill="none"
              stroke="url(#mapGradient)"
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          <defs>
            <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0" />
              <stop offset="50%" stopColor="#FFD700" stopOpacity="1" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Patient Dot */}
        {activeEmergency && (
          <motion.div 
            animate={{ scale: [1, 1.5, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] z-10"
            style={{ left: `${patientLoc.x}%`, top: `${patientLoc.y}%`, transform: 'translate(-50%, -50%)' }}
          />
        )}

        {/* Hospital Marker */}
        {activeEmergency && (
          <div 
            className="absolute p-1.5 rounded-lg bg-gold text-black shadow-lg z-10"
            style={{ left: `${hospitalLoc.x}%`, top: `${hospitalLoc.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <Hospital className="w-3 h-3" />
          </div>
        )}

        {/* Route Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <motion.path 
            d="M 50 150 Q 150 100 250 200 T 350 50" 
            fill="none" 
            stroke="rgba(255, 215, 0, 0.3)" 
            strokeWidth="4" 
            strokeDasharray="8 8"
            animate={{ strokeDashoffset: [0, -16] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <path d="M 50 150 Q 150 100 250 200 T 350 50" fill="none" stroke="gold" strokeWidth="2" opacity="0.5" />
        </svg>

        {/* Ambulance Marker */}
        <motion.div 
          initial={{ x: 50, y: 150 }}
          animate={{ x: [50, 150, 250, 350], y: [150, 100, 200, 50] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute w-6 h-6 -ml-3 -mt-3 flex items-center justify-center z-10"
        >
          <div className="absolute inset-0 bg-gold/20 rounded-full animate-ping" />
          <div className="w-3 h-3 bg-gold rounded-full shadow-[0_0_10px_gold]" />
        </motion.div>

        {/* Hospital Marker */}
        <div className="absolute top-[50px] left-[350px] -ml-4 -mt-4 flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black shadow-lg">
            <Hospital className="w-5 h-5" />
          </div>
          <span className="text-[8px] font-bold bg-black/80 px-1 rounded">ST. MARY'S</span>
        </div>

        {/* Legend */}
        {activeEmergency && (
          <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
            <div className="flex items-center justify-between p-3 glass rounded-xl text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-white/60">Patient {activeEmergency.id}</span>
              </div>
              <span className="font-bold">{activeEmergency.location}</span>
            </div>
            <div className="flex items-center justify-between p-3 glass rounded-xl text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold" />
                <span className="text-white/60">Assigned: {activeEmergency.hospitalName}</span>
              </div>
              <span className="font-bold text-gold">{activeEmergency.eta || 'EN ROUTE'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Nearby Hospitals View ---
const HospitalsView = ({ hospitals: dynamicHospitals }: { hospitals: HospitalData[] }) => {
  const [sortBy, setSortBy] = useState<'distance' | 'beds' | 'waitTime'>('distance');
  const [isSortOpen, setIsSortOpen] = useState(false);

  const initialHospitals = [
    { 
      id: 1, 
      name: "SSG Hospital", 
      address: "Jail Road, Raopura, Vadodara, Gujarat", 
      distance: "0.8 km away", 
      distanceVal: 0.8,
      driveTime: "5 mins", 
      waitTime: "15 mins", 
      waitTimeVal: 15,
      beds: "6/40", 
      bedsVal: 6,
      bedPercent: 15,
      lat: 22.3072,
      lng: 73.1812,
      level: 1,
      icuAvailable: 6,
      icuTotal: 40,
      ventsAvailable: 4,
      ventsTotal: 10,
      hasNeuro: true,
      hasCathLab: true,
      load: 85
    },
    { 
      id: 2, 
      name: "Bhailal Amin General Hospital", 
      address: "GIDC Rd, Gorwa, Vadodara, Gujarat", 
      distance: "1.3 km away", 
      distanceVal: 1.3,
      driveTime: "8 mins", 
      waitTime: "10 mins", 
      waitTimeVal: 10,
      beds: "19/50", 
      bedsVal: 19,
      bedPercent: 38,
      lat: 22.3321,
      lng: 73.1567,
      level: 1,
      icuAvailable: 19,
      icuTotal: 50,
      ventsAvailable: 12,
      ventsTotal: 25,
      hasNeuro: true,
      hasCathLab: false,
      load: 62
    },
    { 
      id: 3, 
      name: "Baroda Medical College Hospital", 
      address: "Anandpura, Vadodara, Gujarat", 
      distance: "1.7 km away", 
      distanceVal: 1.7,
      driveTime: "12 mins", 
      waitTime: "20 mins", 
      waitTimeVal: 20,
      beds: "7/30", 
      bedsVal: 7,
      bedPercent: 23,
      lat: 22.3085,
      lng: 73.1921,
      level: 1,
      icuAvailable: 7,
      icuTotal: 30,
      ventsAvailable: 5,
      ventsTotal: 15,
      hasNeuro: false,
      hasCathLab: false,
      load: 77
    },
    { 
      id: 4, 
      name: "Kailash Cancer Hospital", 
      address: "Munjmahuda, Vadodara, Gujarat", 
      distance: "2.2 km away", 
      distanceVal: 2.2,
      driveTime: "15 mins", 
      waitTime: "5 mins", 
      waitTimeVal: 5,
      beds: "33/60", 
      bedsVal: 33,
      bedPercent: 55,
      lat: 22.2891,
      lng: 73.1745,
      level: 2,
      icuAvailable: 33,
      icuTotal: 60,
      ventsAvailable: 15,
      ventsTotal: 30,
      hasNeuro: false,
      hasCathLab: true,
      load: 45
    },
    { 
      id: 5, 
      name: "Sterling Hospital", 
      address: "Race Course Road, Vadodara, Gujarat", 
      distance: "2.5 km away", 
      distanceVal: 2.5,
      driveTime: "18 mins", 
      waitTime: "8 mins", 
      waitTimeVal: 8,
      beds: "25/45", 
      bedsVal: 25,
      bedPercent: 55,
      lat: 22.3123,
      lng: 73.1678,
      level: 1,
      icuAvailable: 25,
      icuTotal: 45,
      ventsAvailable: 20,
      ventsTotal: 25,
      hasNeuro: true,
      hasCathLab: true,
      load: 35
    }
  ];

  const displayHospitals = dynamicHospitals.length > 0 ? dynamicHospitals : initialHospitals;

  const sortedHospitals = [...displayHospitals].sort((a, b) => {
    if (sortBy === 'distance') return a.distanceVal - b.distanceVal;
    if (sortBy === 'beds') return b.bedsVal - a.bedsVal; // More beds first
    if (sortBy === 'waitTime') return a.waitTimeVal - b.waitTimeVal; // Less wait time first
    return 0;
  });

  const sortOptions = [
    { id: 'distance', label: 'Sort by Distance' },
    { id: 'beds', label: 'Sort by Available Beds' },
    { id: 'waitTime', label: 'Sort by Wait Time' }
  ];

  const handleViewRoute = (h: HospitalData) => {
    // Ensuring the route starts from the user's current location with driving directions
    const url = `https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=${h.lat},${h.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-display font-bold mb-2">Nearby Hospitals</h2>
          <p className="text-white/40">Top facilities by proximity—ready to wire to live capacity APIs.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-6 py-3 glass rounded-2xl flex items-center gap-2 text-sm font-bold hover:bg-white/5 transition-all">
            <RotateCcw className="w-4 h-4" />
            Refresh
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="px-6 py-3 glass rounded-2xl flex items-center gap-2 text-sm font-bold hover:bg-white/5 transition-all min-w-[200px] justify-between"
            >
              {sortOptions.find(o => o.id === sortBy)?.label}
              <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isSortOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-full bg-white rounded-xl shadow-2xl overflow-hidden z-30 py-1"
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSortBy(option.id as any);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                        sortBy === option.id 
                          ? 'bg-[#1a73e8] text-white' 
                          : 'text-black hover:bg-gray-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedHospitals.map((h, i) => (
          <motion.div 
            key={h.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-8 glass rounded-[32px] hover:border-gold/20 transition-all group relative overflow-hidden h-full flex flex-col"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-bold leading-tight">{h.name}</h4>
                  <p className="text-xs text-white/40 mt-1">{h.address}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40 font-medium">Distance:</span>
                <span className="font-bold">{h.distance}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40 font-medium">Drive Time:</span>
                <span className="font-bold">{h.driveTime}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40 font-medium">Wait Time:</span>
                <span className="font-bold">{h.waitTime}</span>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/40 font-medium">Available Beds:</span>
                <span className="font-bold">{h.beds}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${h.bedPercent}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={`h-full rounded-full ${h.bedPercent < 20 ? 'bg-orange-500' : 'bg-gold'}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <button 
                onClick={() => handleViewRoute(h)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gold text-black font-bold text-sm hover:bg-gold/90 transition-all active:scale-95"
              >
                <Navigation className="w-4 h-4" />
                View Route
              </button>
              <button className="flex items-center justify-center gap-2 py-3 rounded-xl glass hover:bg-white/5 transition-all text-sm font-bold">
                <Phone className="w-4 h-4" />
                Call
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Settings View ---
const SettingsView = ({ user, onUpdateUser }: { user: User | null, onUpdateUser: (updates: Partial<User>) => void }) => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
    { id: 'account', label: 'Plan & Usage', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'medical', label: 'Medical History', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="flex h-[calc(100vh-180px)] gap-8">
      {/* Settings Navigation */}
      <div className="w-64 flex flex-col gap-1">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input 
            type="text" 
            placeholder="Search settings..." 
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-gold/30"
          />
        </div>
        
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-white/10 text-white' 
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="flex-1 glass rounded-3xl p-8 overflow-y-auto">
        <h3 className="text-2xl font-display font-bold mb-8 capitalize">{activeTab}</h3>

        {activeTab === 'general' && (
          <div className="space-y-8">
            <section>
              <h4 className="text-sm font-bold text-white/30 uppercase tracking-widest mb-4">Account Profile</h4>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                    {user?.initials || '??'}
                  </div>
                  <div>
                    <p className="font-bold">{user?.name || 'Guest User'}</p>
                    <p className="text-xs text-white/40">{user?.email || 'Please log in to see details'}</p>
                  </div>
                </div>
                <button className="px-4 py-2 glass rounded-xl text-xs font-bold hover:bg-white/5 transition-all flex items-center gap-2">
                  Edit Profile <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-bold text-white/30 uppercase tracking-widest mb-4">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-gold/30 transition-all">
                  <p className="text-[10px] text-white/30 font-bold uppercase mb-1">Age</p>
                  <input 
                    type="text" 
                    value={user?.age || '24 Years'} 
                    onChange={(e) => onUpdateUser({ age: e.target.value })}
                    className="bg-transparent font-bold text-white border-none focus:outline-none w-full" 
                  />
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-gold/30 transition-all">
                  <p className="text-[10px] text-white/30 font-bold uppercase mb-1">Blood Group</p>
                  <input 
                    type="text" 
                    value={user?.bloodGroup || 'O Positive'} 
                    onChange={(e) => onUpdateUser({ bloodGroup: e.target.value })}
                    className="bg-transparent font-bold text-red-400 border-none focus:outline-none w-full" 
                  />
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-bold text-white/30 uppercase tracking-widest mb-4">Preferences</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="font-bold text-sm">Sync layouts across windows</p>
                    <p className="text-xs text-white/40">When enabled, all windows share the same layout</p>
                  </div>
                  <div 
                    onClick={() => onUpdateUser({ syncLayouts: !user?.syncLayouts })}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                      user?.syncLayouts ? 'bg-gold' : 'bg-white/10'
                    }`}
                  >
                    <motion.div 
                      animate={{ x: user?.syncLayouts ? 24 : 4 }}
                      initial={false}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg" 
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="font-bold text-sm">Status Bar</p>
                    <p className="text-xs text-white/40">Show real-time status bar in dashboard</p>
                  </div>
                  <div 
                    onClick={() => onUpdateUser({ showStatusBar: !user?.showStatusBar })}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                      user?.showStatusBar ? 'bg-gold' : 'bg-white/10'
                    }`}
                  >
                    <motion.div 
                      animate={{ x: user?.showStatusBar ? 24 : 4 }}
                      initial={false}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg" 
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'medical' && (
          <div className="space-y-8">
            <section>
              <h4 className="text-sm font-bold text-white/30 uppercase tracking-widest mb-4">Past Hospitals Visited</h4>
              <div className="space-y-4">
                {[
                  { name: "SSG Hospital", date: "Mar 12, 2026", reason: "Routine Checkup" },
                  { name: "Sterling Hospital", date: "Jan 05, 2026", reason: "Emergency - Fracture" },
                  { name: "Apollo Hospital", date: "Nov 22, 2025", reason: "Consultation" }
                ].map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{h.name}</p>
                        <p className="text-xs text-white/40">{h.reason}</p>
                      </div>
                    </div>
                    <p className="text-xs font-mono text-white/30">{h.date}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-8">
            <section>
              <h4 className="text-sm font-bold text-white/30 uppercase tracking-widest mb-4">Current Plan</h4>
              <div className="p-6 bg-gradient-to-br from-gold/20 to-transparent rounded-3xl border border-gold/20">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-2xl font-bold text-gold">Pro Healthcare</p>
                    <p className="text-sm text-white/60">Advanced emergency features enabled</p>
                  </div>
                  <div className="px-4 py-2 bg-gold text-black font-bold rounded-xl text-xs">ACTIVE</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-gold" />
                    Unlimited Ambulance Dispatches
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-gold" />
                    Priority AI Detection
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

// --- About Us View ---
const AboutView = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-4xl mx-auto space-y-12 py-10"
  >
    <div className="text-center space-y-4">
      <h2 className="text-5xl font-display font-bold text-gold">Our Vision</h2>
      <p className="text-white/40 text-lg">Revolutionizing emergency response through deep integration and real-time intelligence.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="glass p-10 rounded-[40px] border-gold/10 gold-glow">
        <p className="text-xl leading-relaxed text-white/80">
          The Golden Root project was conceived to eliminate the critical delays in emergency triage that often cost lives. By seamlessly connecting vision-based accident classification with real-time hospital operational data, we've created a first-of-its-kind ecosystem where the right care is identified before the ambulance even reaches the scene.
        </p>
      </div>

      <div className="glass p-10 rounded-[40px] border-gold/10 gold-glow">
        <p className="text-xl leading-relaxed text-white/80">
          In the healthcare sector, our system serves as a force multiplier for dispatchers and medical professionals alike. By automating the identification of trauma levels and providing instant, live updates on ICU bed availability and specialized unit status, we ensure that every critical patient is routed to the facility most capable of saving them, significantly reducing wait times and improving overall survival rates across the regional network.
        </p>
      </div>
    </div>
  </motion.div>
);

// --- Landing Page Components ---
const Hero = ({ setView }: { setView: (v: View) => void }) => {
  const handleTriggerAlert = () => {
    // Redirect to the dispatcher dashboard on port 5173
    window.location.href = 'http://localhost:5173';
  };

  return (
    <div className="py-20 flex flex-col items-center text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-gold/20 text-gold text-xs font-bold mb-8"
      >
        <AlertTriangle className="w-4 h-4" />
        Emergency Response in Seconds
      </motion.div>
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-7xl font-display font-bold tracking-tight mb-8 max-w-4xl leading-[1.1]"
      >
        The Future of <span className="text-gold">Emergency Dispatch</span> is Here.
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-white/40 max-w-2xl mb-12 leading-relaxed"
      >
        Golden Root uses advanced AI to detect accidents and route ambulances in real-time. 
        Saving lives through precision and speed.
      </motion.p>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-6"
      >
        <button 
          onClick={handleTriggerAlert}
          className="px-8 py-4 bg-gold text-black font-bold rounded-2xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,215,0,0.3)]"
        >
          Trigger Alert
        </button>
        <button 
          onClick={() => setView('manual')}
          className="px-8 py-4 glass rounded-2xl font-bold hover:bg-white/5 transition-all"
        >
          Manual
        </button>
      </motion.div>
    </div>
  );
};

const Features = () => {
  const features = [
    { icon: <Activity className="w-6 h-6" />, title: 'Real-time Tracking', desc: 'Monitor every ambulance and incident with millisecond precision.' },
    { icon: <Shield className="w-6 h-6" />, title: 'AI Detection', desc: 'Automatic accident detection using multi-sensor data fusion.' },
    { icon: <Bell className="w-6 h-6" />, title: 'Emergency Alerts', desc: 'Instant notification to nearest hospitals and emergency contacts.' },
    { icon: <Navigation className="w-6 h-6" />, title: 'Fast Routing', desc: 'Dynamic traffic-aware routing for the fastest possible response.' },
  ];

  return (
    <div className="py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {features.map((f, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="p-8 glass rounded-3xl border-white/5 hover:border-gold/20 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold mb-6 group-hover:scale-110 transition-transform">
            {f.icon}
          </div>
          <h4 className="text-xl font-bold mb-3">{f.title}</h4>
          <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
        </motion.div>
      ))}
    </div>
  );
};

const AmbulanceStatusCards = () => {
  const statuses = [
    { label: 'Available', count: 12, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Busy', count: 8, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Incoming', count: 3, color: 'text-gold', bg: 'bg-gold/10' },
  ];

  return (
    <div className="py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
      {statuses.map((s, i) => (
        <div key={i} className="p-8 glass rounded-3xl border-white/5">
          <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center ${s.color} mb-6`}>
            <Ambulance className="w-6 h-6" />
          </div>
          <p className="text-sm text-white/40 font-bold uppercase tracking-widest mb-1">{s.label}</p>
          <p className="text-4xl font-bold">{s.count}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/20">
            <Clock className="w-3 h-3" />
            Updated just now
          </div>
        </div>
      ))}
    </div>
  );
};

// --- User Roles View ---
const UserRolesView = () => {
  const [submitted, setSubmitted] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<{ [key: string]: string | null }>({});
  const [formData, setFormData] = useState({
    hospitalPerson: '',
    timeReported: '',
    incidentDescription: '',
    personPhone: '',
    personAge: '',
    personBlood: '',
    personConditions: '',
    personAddress: '',
    ambulanceNumber: '',
    ambulanceReg: '',
    driverName: '',
    driverPhone: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (section: string, fields: string[]) => {
    const emptyFields = fields.filter(f => !formData[f as keyof typeof formData]);
    
    if (emptyFields.length > 0) {
      setError(prev => ({ ...prev, [section]: "All fields are compulsory. Please fill them all." }));
      return;
    }

    setError(prev => ({ ...prev, [section]: null }));
    setSubmitted(prev => ({ ...prev, [section]: true }));
    setTimeout(() => {
      setSubmitted(prev => ({ ...prev, [section]: false }));
    }, 3000);
  };

  const InputField = ({ label, placeholder, type = "text", value, onChange }: { label: string, placeholder: string, type?: string, value: string, onChange: (val: string) => void }) => (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-gold/30 transition-all"
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="mb-10">
        <h2 className="text-4xl font-display font-bold mb-2">User Roles & Incident Reporting</h2>
        <p className="text-white/40">Capture critical data for emergency response and hospital coordination.</p>
      </div>

      {/* Incident Report (ETM) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[32px] p-8 border-white/5 relative overflow-hidden"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-display font-bold">Incident Report (ETM)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <InputField 
            label="Person in Charge (Hospital)" 
            placeholder="Enter name" 
            value={formData.hospitalPerson}
            onChange={(val) => handleInputChange('hospitalPerson', val)}
          />
          <InputField 
            label="Time Reported" 
            placeholder="HH:MM" 
            type="time" 
            value={formData.timeReported}
            onChange={(val) => handleInputChange('timeReported', val)}
          />
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Incident Description</label>
            <textarea 
              placeholder="What actually happened to the injured person?"
              value={formData.incidentDescription}
              onChange={(e) => handleInputChange('incidentDescription', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-gold/30 transition-all h-32 resize-none"
            />
          </div>
        </div>

        {error.incident && (
          <p className="text-red-500 text-xs mb-4 font-medium">{error.incident}</p>
        )}

        <button 
          onClick={() => handleSubmit('incident', ['hospitalPerson', 'timeReported', 'incidentDescription'])}
          className="w-full py-4 bg-gold text-black font-bold rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          {submitted.incident ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Submitted Successfully
            </>
          ) : 'Submit Incident Report'}
        </button>
      </motion.div>

      {/* Injured Person Details */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-[32px] p-8 border-white/5"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-display font-bold">Injured Person Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <InputField 
            label="Phone Number" 
            placeholder="+91 XXXXX XXXXX" 
            type="tel" 
            value={formData.personPhone}
            onChange={(val) => handleInputChange('personPhone', val)}
          />
          <InputField 
            label="Age" 
            placeholder="Enter age" 
            type="number" 
            value={formData.personAge}
            onChange={(val) => handleInputChange('personAge', val)}
          />
          <InputField 
            label="Blood Group" 
            placeholder="e.g. O+" 
            value={formData.personBlood}
            onChange={(val) => handleInputChange('personBlood', val)}
          />
          <InputField 
            label="Pre-existing Conditions" 
            placeholder="e.g. Diabetes, Hypertension" 
            value={formData.personConditions}
            onChange={(val) => handleInputChange('personConditions', val)}
          />
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Address</label>
            <textarea 
              placeholder="Enter full address"
              value={formData.personAddress}
              onChange={(e) => handleInputChange('personAddress', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-gold/30 transition-all h-24 resize-none"
            />
          </div>
        </div>

        {error.person && (
          <p className="text-red-500 text-xs mb-4 font-medium">{error.person}</p>
        )}

        <button 
          onClick={() => handleSubmit('person', ['personPhone', 'personAge', 'personBlood', 'personConditions', 'personAddress'])}
          className="w-full py-4 bg-blue-500 text-white font-bold rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          {submitted.person ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Details Saved
            </>
          ) : 'Submit Person Details'}
        </button>
      </motion.div>

      {/* Ambulance Details */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-[32px] p-8 border-white/5"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400">
            <Ambulance className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-display font-bold">Ambulance Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <InputField 
            label="Ambulance Number" 
            placeholder="e.g. GJ-06-XX-XXXX" 
            value={formData.ambulanceNumber}
            onChange={(val) => handleInputChange('ambulanceNumber', val)}
          />
          <InputField 
            label="Registration Number" 
            placeholder="Enter registration number" 
            value={formData.ambulanceReg}
            onChange={(val) => handleInputChange('ambulanceReg', val)}
          />
          <InputField 
            label="Driver's Name" 
            placeholder="Enter driver name" 
            value={formData.driverName}
            onChange={(val) => handleInputChange('driverName', val)}
          />
          <InputField 
            label="Driver's Phone" 
            placeholder="+91 XXXXX XXXXX" 
            type="tel" 
            value={formData.driverPhone}
            onChange={(val) => handleInputChange('driverPhone', val)}
          />
        </div>

        {error.ambulance && (
          <p className="text-red-500 text-xs mb-4 font-medium">{error.ambulance}</p>
        )}

        <button 
          onClick={() => handleSubmit('ambulance', ['ambulanceNumber', 'ambulanceReg', 'driverName', 'driverPhone'])}
          className="w-full py-4 bg-green-500 text-white font-bold rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          {submitted.ambulance ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Ambulance Assigned
            </>
          ) : 'Submit Ambulance Details'}
        </button>
      </motion.div>
    </div>
  );
};

// --- Manual View (Emergency Help Guide) ---
const ManualView = () => {
  const [lang, setLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const guides = [
    {
      id: 'cardiac',
      icon: <HeartPulse className="w-6 h-6" />,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      title: {
        en: '1. CARDIAC ARREST (Heart Attack)',
        hi: '1. हृदय गति रुकना (Heart Attack)',
        mr: '1. हृदयविकाराचा झटका (Heart Attack)'
      },
      steps: {
        en: [
          'Check if person is responsive',
          'Call ambulance immediately',
          'Start CPR: Push hard & fast in center of chest',
          '100–120 compressions/min',
          'If trained → give mouth-to-mouth',
          'Do NOT leave the person alone'
        ],
        hi: [
          'देखें व्यक्ति होश में है या नहीं',
          'तुरंत एम्बुलेंस बुलाएँ',
          'CPR शुरू करें: छाती के बीच में जोर से दबाएँ',
          '100–120 बार प्रति मिनट',
          'यदि जानते हैं → मुँह से साँस दें',
          'व्यक्ति को अकेला न छोड़ें'
        ],
        mr: [
          'व्यक्ती शुद्धीत आहे का ते तपासा',
          'लगेच अॅम्ब्युलन्सला कॉल करा',
          'CPR सुरू करा: छातीच्या मध्यभागी जोरात दाब द्या',
          'प्रति मिनिट 100–120 वेळा',
          'माहिती असल्यास कृत्रिम श्वास द्या',
          'व्यक्तीला एकटे सोडू नका'
        ]
      }
    },
    {
      id: 'head',
      icon: <Brain className="w-6 h-6" />,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      title: {
        en: '2. HEAD INJURY / ACCIDENT',
        hi: '2. सिर की चोट / दुर्घटना',
        mr: '2. डोक्याला दुखापत / अपघात'
      },
      steps: {
        en: [
          'Do NOT move neck/head',
          'Keep person still',
          'Stop bleeding with cloth',
          'Keep head slightly elevated',
          'Watch for unconsciousness'
        ],
        hi: [
          'गर्दन/सिर को न हिलाएँ',
          'व्यक्ति को स्थिर रखें',
          'खून बह रहा हो तो कपड़े से रोकें',
          'सिर थोड़ा ऊँचा रखें',
          'बेहोशी पर ध्यान रखें'
        ],
        mr: [
          'मान/डोके हलवू नका',
          'व्यक्तीला स्थिर ठेवा',
          'रक्तस्त्राव थांबवण्यासाठी कापड वापरा',
          'डोके थोडे उंच ठेवा',
          'बेशुद्ध पडत आहे का ते पाहा'
        ]
      }
    },
    {
      id: 'bleeding',
      icon: <Droplets className="w-6 h-6" />,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      title: {
        en: '3. HEAVY BLEEDING',
        hi: '3. भारी रक्तस्राव',
        mr: '3. अति रक्तस्त्राव'
      },
      steps: {
        en: [
          'Apply direct pressure on wound',
          'Use clean cloth or bandage',
          'Raise injured area if possible',
          'Do NOT remove object stuck in wound',
          'Keep person calm'
        ],
        hi: [
          'घाव पर सीधे दबाव डालें',
          'साफ कपड़ा या पट्टी लगाएँ',
          'संभव हो तो घायल भाग ऊपर रखें',
          'घाव में फंसी चीज न निकालें',
          'व्यक्ति को शांत रखें'
        ],
        mr: [
          'जखमेवर थेट दाब द्या',
          'स्वच्छ कापड/बँडेज वापरा',
          'शक्य असल्यास जखमी भाग उंच ठेवा',
          'जखमेत अडकलेली वस्तू काढू नका',
          'व्यक्तीला शांत ठेवा'
        ]
      }
    },
    {
      id: 'unconscious',
      icon: <UserX className="w-6 h-6" />,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      title: {
        en: '4. UNCONSCIOUS PERSON',
        hi: '4. बेहोश व्यक्ति',
        mr: '4. बेशुद्ध व्यक्ती'
      },
      steps: {
        en: [
          'Check breathing',
          'If breathing → place in recovery position',
          'If not → start CPR',
          'Loosen tight clothes',
          'Do NOT give food/water'
        ],
        hi: [
          'सांस चल रही है या नहीं देखें',
          'सांस है → साइड में लिटाएँ',
          'सांस नहीं → CPR करें',
          'तंग कपड़े ढीले करें',
          'खाना/पानी न दें'
        ],
        mr: [
          'श्वास चालू आहे का ते तपासा',
          'श्वास असेल → बाजूला झोपवा',
          'श्वास नसेल → CPR करा',
          'घट्ट कपडे सैल करा',
          'खाणे/पाणी देऊ नका'
        ]
      }
    },
    {
      id: 'burns',
      icon: <Flame className="w-6 h-6" />,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      title: {
        en: '5. BURNS (Fire / Chemical)',
        hi: '5. जलना (आग / रसायन)',
        mr: '5. भाजणे (आग / रासायनिक)'
      },
      steps: {
        en: [
          'Cool burn with running water (10–15 min)',
          'Do NOT apply oil/cream',
          'Cover with clean cloth',
          'Do NOT burst blisters',
          'Keep person hydrated'
        ],
        hi: [
          'जले स्थान पर पानी डालें (10–15 मिनट)',
          'तेल/क्रीम न लगाएँ',
          'साफ कपड़े से ढकें',
          'फफोले न फोड़ें',
          'पानी पिलाएँ'
        ],
        mr: [
          'जळलेल्या भागावर पाणी टाका (10–15 मिनिटे)',
          'तेल/क्रीम लावू नका',
          'स्वच्छ कापडाने झाका',
          'फोड फोडू नका',
          'पाणी पाजत राहा'
        ]
      }
    }
  ];

  const selectedGuide = guides.find(g => g.id === selectedId);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-12">
        <h2 className="text-4xl font-display font-bold mb-2">Emergency Help Guide</h2>
        <p className="text-gold font-medium">“Golden Minutes Care” — Every second counts.</p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedId ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="md:col-span-2 mb-4">
              <h3 className="text-xl font-bold text-white/60">What happened? Select a situation:</h3>
            </div>
            {guides.map((guide) => (
              <button
                key={guide.id}
                onClick={() => setSelectedId(guide.id)}
                className="glass rounded-[32px] p-8 border-white/5 hover:border-gold/20 transition-all group text-left flex items-center gap-6"
              >
                <div className={`w-16 h-16 rounded-2xl ${guide.bg} flex items-center justify-center ${guide.color} group-hover:scale-110 transition-transform shrink-0`}>
                  {guide.icon}
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-1">{guide.title.en}</h4>
                  <p className="text-sm text-white/40">Click to view precautions</p>
                </div>
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <button 
                onClick={() => setSelectedId(null)}
                className="flex items-center gap-2 text-gold font-bold hover:translate-x-[-4px] transition-transform w-fit"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Situations
              </button>

              <div className="flex items-center gap-3 glass p-2 rounded-2xl">
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest px-3">Select Language</span>
                <select 
                  value={lang}
                  onChange={(e) => setLang(e.target.value as any)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gold/30 transition-all cursor-pointer"
                >
                  <option value="en" className="bg-dark-bg">🇬🇧 English</option>
                  <option value="hi" className="bg-dark-bg">🇮🇳 Hindi</option>
                  <option value="mr" className="bg-dark-bg">🇮🇳 Marathi</option>
                </select>
              </div>
            </div>

            {selectedGuide && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-[40px] p-10 border-white/5 gold-glow"
              >
                <div className="flex items-center gap-6 mb-10">
                  <div className={`w-20 h-20 rounded-[28px] ${selectedGuide.bg} flex items-center justify-center ${selectedGuide.color}`}>
                    {selectedGuide.icon}
                  </div>
                  <h3 className="text-3xl font-display font-bold leading-tight">{selectedGuide.title[lang]}</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {selectedGuide.steps[lang].map((step, sIdx) => (
                    <motion.div 
                      key={sIdx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: sIdx * 0.05 }}
                      className="flex items-start gap-6 p-6 rounded-3xl bg-white/5 border border-white/5"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-gold/10 flex items-center justify-center text-gold font-bold shrink-0 border border-gold/20">
                        {sIdx + 1}
                      </div>
                      <span className="text-xl leading-relaxed">{step}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="mt-12 p-8 glass rounded-[32px] border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-3 mb-4 text-red-500">
          <AlertTriangle className="w-6 h-6" />
          <h4 className="font-bold uppercase tracking-widest">Critical Warning</h4>
        </div>
        <p className="text-white/60 text-sm leading-relaxed">
          This guide is for informational purposes only. In any emergency, your first action should always be to call professional emergency services. Do not attempt complex medical procedures if you are not trained.
        </p>
      </div>
    </div>
  );
};

// --- Login Modal Component ---
const LoginModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean, onClose: () => void, onLogin: (u: User) => void }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass w-[400px] rounded-[40px] p-10 border-gold/20 gold-glow relative"
      >
        <button onClick={onClose} className="absolute right-6 top-6 text-white/40 hover:text-white">
          <ArrowLeft className="w-5 h-5 rotate-90" />
        </button>

        <h3 className="text-3xl font-display font-bold mb-2">{isSignUp ? 'Join Golden Root' : 'Welcome Back'}</h3>
        <p className="text-sm text-white/40 mb-8 border-b border-white/10 pb-4">
          {isSignUp ? 'Create an account to start dispatching' : 'Access your professional dashboard'}
        </p>

        <div className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-2">Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-gold/30 transition-all font-medium"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-2">Email Address</label>
            <input 
              type="email" 
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-gold/30 transition-all font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-2">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-gold/30 transition-all font-medium"
            />
          </div>
        </div>

        <button 
          onClick={() => {
            const name = isSignUp ? formData.name : 'Dispatcher ' + formData.email.split('@')[0];
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            onLogin({ 
              name, 
              email: formData.email, 
              initials,
              age: '24 Years',
              bloodGroup: 'O Positive',
              syncLayouts: true,
              showStatusBar: true
            });
          }}
          className="w-full py-4 bg-gold text-black font-black rounded-2xl mt-8 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)]"
        >
          {isSignUp ? 'Create Account' : 'Sign In'}
        </button>

        <p className="text-center text-xs text-white/40 mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-gold font-bold hover:underline">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

// --- Main Dashboard Layout ---
export default function App() {
  const [view, setView] = useState<View>('landing');
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch Hospitals
        const hRes = await fetch('http://localhost:3001/api/hospitals');
        const hData = await hRes.json();
        if (hData.success) {
          const mapped = hData.data.map((h: any) => ({
            id: h.id,
            name: h.name,
            address: h.address || 'Pune, India',
            lat: parseFloat(h.latitude),
            lng: parseFloat(h.longitude),
            distance: `${(Math.random() * 5 + 0.5).toFixed(1)} km away`,
            distanceVal: Math.random() * 5,
            driveTime: `${Math.floor(Math.random() * 20 + 5)} mins`,
            waitTime: `${h.current_load_percent ? Math.floor(h.current_load_percent / 5) : 10} mins`,
            waitTimeVal: h.current_load_percent || 0,
            beds: `${h.icu_beds_available}/${h.icu_beds_total}`,
            bedsVal: h.icu_beds_available,
            bedPercent: h.icu_beds_total > 0 ? (h.icu_beds_available / h.icu_beds_total) * 100 : 0
          }));
          setHospitals(mapped);
        }

        // Fetch Active Emergencies
        const pRes = await fetch('http://localhost:3001/api/patients?status=dispatched');
        const pData = await pRes.json();
        if (pData.success) {
          const mappedE = pData.data.map((p: any) => ({
            id: `PAT-${p.incident_id || p.id}`,
            severity: p.severity_level.charAt(0).toUpperCase() + p.severity_level.slice(1),
            location: p.location_name || 'Pune Central',
            time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hospitalName: p.assigned_hospital_name,
            hospitalLat: p.hospital_latitude,
            hospitalLng: p.hospital_longitude,
            patientLat: parseFloat(p.latitude) || 18.5204,
            patientLng: parseFloat(p.longitude) || 73.8567,
            matchScore: Math.floor(Math.random() * 10 + 90),
            eta: `${p.estimated_transit_minutes || 10} mins`,
            reasons: [
              'Specialized unit confirmed active',
              'Optimal ambulance path calculated',
              'Hospital capacity validated'
            ]
          }));
          setEmergencies(mappedE);
        }
      } catch (err) {
        console.error("Failed to fetch real-time dashboard data:", err);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000); // Faster refresh for dashboard
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-dark-bg text-white overflow-hidden">
      <Sidebar currentView={view} setView={setView} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        {/* Header - Only show for non-landing views or as a floating bar */}
        {view !== 'landing' && (
          <header className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-display font-bold mb-1 capitalize">
                {view}
              </h1>
              <p className="text-white/40 text-sm">
                {currentUser ? `Welcome back, ${currentUser.name}` : 'Welcome to Golden Root Dispatch'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Search anything..." 
                  className="pl-12 pr-6 py-3 rounded-2xl glass focus:outline-none focus:border-gold/30 transition-all w-64 text-sm"
                />
              </div>
              <button className="w-12 h-12 glass rounded-2xl flex items-center justify-center hover:bg-white/5 transition-all relative">
                <Bell className="w-5 h-5 text-white/60" />
                <span className="absolute top-3 right-3 w-2 h-2 bg-gold rounded-full border-2 border-dark-bg" />
              </button>
              
              {currentUser ? (
                <div 
                  className="h-12 px-2 flex items-center gap-3 glass rounded-2xl border border-gold/10 hover:border-gold/30 transition-all cursor-pointer group"
                  onClick={() => setView('settings')}
                >
                  <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center text-gold font-bold text-xs">
                    {currentUser.initials}
                  </div>
                  <span className="text-sm font-bold pr-2 group-hover:text-gold transition-colors">{currentUser.name.split(' ')[0]}</span>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-6 py-3 bg-gold text-black font-black rounded-2xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,215,0,0.2)] text-sm"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </header>
        )}

        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto"
            >
              <Hero setView={setView} />
              <Features />
              <div className="py-20">
                <div className="glass rounded-[40px] p-12 border-gold/10 gold-glow overflow-hidden relative">
                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                      <h2 className="text-5xl font-display font-bold mb-6">Live Response Network</h2>
                      <p className="text-lg text-white/40 mb-8 leading-relaxed">
                        Our proprietary network connects every emergency asset in the city. 
                        Real-time data visualization allows for split-second decision making.
                      </p>
                      <button 
                        onClick={() => setView('manual')}
                        className="px-8 py-4 bg-gold text-black font-bold rounded-2xl hover:scale-105 transition-transform"
                      >
                        Manual
                      </button>
                    </div>
                    <div className="h-[400px] rounded-3xl bg-black/40 border border-white/5 overflow-hidden relative">
                       <MiniMapPreview activeEmergency={emergencies[0] || null} />
                    </div>
                  </div>
                </div>
              </div>
              <footer className="py-20 border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                        <Activity className="w-6 h-6" />
                      </div>
                      <span className="text-2xl font-display font-bold text-gold tracking-tight">Golden Root</span>
                    </div>
                    <p className="text-white/40 text-sm leading-relaxed italic">
                      "Arogyam Dhansampada" — Health is the true wealth. We are committed to preserving it through speed and technology.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-gold font-bold uppercase tracking-widest text-xs">Safety First</h4>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3 text-sm text-white/60">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                        <span>Don't drink and drive. Your life and others' are worth more than a glass.</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-white/60">
                        <Shield className="w-5 h-5 text-gold shrink-0" />
                        <span>Speed thrills but kills. Better late than never.</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-white/60">
                        <Smartphone className="w-5 h-5 text-blue-400 shrink-0" />
                        <span>Eyes on the road, not on the screen. Avoid distractions while driving.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-gold font-bold uppercase tracking-widest text-xs">Health Thoughts</h4>
                    <div className="p-6 glass rounded-2xl border-gold/10">
                      <p className="text-sm text-white/80 italic leading-relaxed">
                        "The greatest of follies is to sacrifice health for any other kind of happiness."
                      </p>
                      <p className="text-[10px] text-gold font-bold mt-4 uppercase">— Arthur Schopenhauer</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                  <p className="text-xs text-white/20">© 2026 Golden Root Emergency Systems. All rights reserved.</p>
                  <div className="flex gap-8 text-xs text-white/40">
                    <a href="#" className="hover:text-gold transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-gold transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-gold transition-colors">Contact Support</a>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-12 gap-8"
            >
              <div className="col-span-8 flex flex-col gap-8">
                <div className="h-[400px]">
                  <ActiveEmergencies emergencies={emergencies} />
                </div>
                <RecommendedHospital emergency={emergencies[0] || null} />
              </div>
              <div className="col-span-4 h-[600px]">
                <MiniMapPreview activeEmergency={emergencies[0] || null} />
              </div>
            </motion.div>
          )}
          {view === 'hospitals' && (
            <motion.div
              key="hospitals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <HospitalsView hospitals={hospitals} />
            </motion.div>
          )}
          {view === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SettingsView 
                user={currentUser} 
                onUpdateUser={(updates) => currentUser && setCurrentUser({ ...currentUser, ...updates })}
              />
            </motion.div>
          )}
          {view === 'userRoles' && (
            <motion.div
              key="userRoles"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <UserRolesView />
            </motion.div>
          )}
          {view === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ManualView />
            </motion.div>
          )}
          {view === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AboutView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Decorative Orbs */}
      <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] bg-gold/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[10%] w-[40%] h-[40%] bg-gold/5 blur-[150px] rounded-full pointer-events-none" />

      <LoginModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={(u) => {
          setCurrentUser(u);
          setIsAuthModalOpen(false);
          // Auto-navigate to settings to show details
          setView('settings');
        }}
      />
    </div>
  );
}
