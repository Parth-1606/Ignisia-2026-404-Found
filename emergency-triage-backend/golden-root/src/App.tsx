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
  Zap,
  ArrowLeft,
  HeartPulse,
  Brain,
  Droplets,
  UserX,
  Flame,
  BookOpen
} from 'lucide-react';
import { useState, useEffect } from 'react';

// --- Types ---
type View = 'landing' | 'hospitals' | 'settings' | 'userRoles' | 'manual' | 'about';

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
    { icon: <Hospital className="w-5 h-5" />, label: 'Hospitals', id: 'hospitals' as View },
    { icon: <Users className="w-5 h-5" />, label: 'User Roles', id: 'userRoles' as View },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', id: 'settings' as View },
    { icon: <Info className="w-5 h-5" />, label: 'About Us', id: 'about' },
  ];

  return (
    <div className="w-64 h-screen border-r border-slate-200 flex flex-col p-6 fixed left-0 top-0 bg-white z-20 shadow-sm">
      <div className="flex items-center gap-3 mb-12 cursor-pointer" onClick={() => setView('landing')}>
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
          <Activity className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-display font-bold tracking-tight text-slate-900">GoldenHour Dispatch</span>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">Main Menu</p>
        {menuItems.map((item, i) => (
          <button 
            key={i} 
            onClick={() => {
              if (item.id === 'landing' || item.id === 'hospitals' || item.id === 'settings' || item.id === 'userRoles' || item.id === 'about') {
                setView(item.id as View);
              }
            }}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group w-full text-left ${
              currentView === item.id ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
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
    <div className="bg-white rounded-3xl p-6 h-full flex flex-col shadow-sm border border-slate-200">
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
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-800">{e.id}</span>
              <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                e.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
              }`}>
                {e.severity}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{e.location}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
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
    <div className="glass rounded-3xl p-8 gold-glow border-blue-100">
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
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Hospital Name</p>
            <p className="text-2xl font-bold">{rec.hospitalName}</p>
          </div>
          
          <div className="flex gap-12">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">ETA</p>
              <p className="text-2xl font-bold text-gold">{rec.eta}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Match Score</p>
              <p className="text-2xl font-bold">{rec.matchScore}%</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-3">Reason for Recommendation</p>
          <ul className="space-y-3">
            {rec.reasons.map((reason, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
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
const MiniMapPreview = ({ emergencies }: { emergencies: Emergency[] }) => {
  const activeEmergency = emergencies[0] || null;
  
  // Simulated Pune cluster coordinates transformed to 0-100 grid for visualization
  const pLoc = activeEmergency ? { 
    x: 40 + (activeEmergency.patientLng % 0.1) * 200, 
    y: 30 + (activeEmergency.patientLat % 0.1) * 200 
  } : { x: 50, y: 50 };

  const hLoc = activeEmergency ? { 
    x: 40 + (activeEmergency.hospitalLng % 0.1) * 200, 
    y: 30 + (activeEmergency.hospitalLat % 0.1) * 200 
  } : { x: 70, y: 70 };

  return (
    <div className="w-full h-full relative cursor-pointer" onClick={() => window.location.href = 'http://localhost:5173'}>
      {/* Background Map Grid */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="h-full w-full" style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, gold 1px, transparent 0)',
          backgroundSize: '30px 30px'
        }} />
      </div>

      <div className="relative h-full w-full bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden">
        {/* Radar Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.05)_0%,transparent_70%)]" />
        
        {activeEmergency && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <motion.line 
              x1={`${pLoc.x}%`} y1={`${pLoc.y}%`} 
              x2={`${hLoc.x}%`} y2={`${hLoc.y}%`}
              stroke="#2563eb" strokeWidth="1" strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        )}

        {/* Patient Pin */}
        {activeEmergency && (
          <motion.div 
            animate={{ scale: [1, 1.5, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute w-3 h-3 bg-red-600 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] z-20"
            style={{ left: `${pLoc.x}%`, top: `${pLoc.y}%`, transform: 'translate(-50%, -50%)' }}
          />
        )}

        {/* Hospital Marker */}
        {activeEmergency && (
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="absolute p-1.5 rounded-lg bg-gold text-slate-900 shadow-lg z-20"
            style={{ left: `${hLoc.x}%`, top: `${hLoc.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <Hospital className="w-3 h-3" />
          </motion.div>
        )}

        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-12">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-blue-100" />
            ))}
          </div>
          <motion.div 
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-px bg-gold/50 shadow-[0_0_15px_gold]"
          />
        </div>

        {!activeEmergency && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2 opacity-30">
              <Activity className="w-8 h-8 mx-auto animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Scanning for active units...</p>
            </div>
          </div>
        )}

        {/* Legend */}
        {activeEmergency && (
          <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
            <div className="flex items-center justify-between p-3 glass rounded-xl text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-slate-600">Patient {activeEmergency.id}</span>
              </div>
              <span className="font-bold">{activeEmergency.location}</span>
            </div>
            <div className="flex items-center justify-between p-3 glass rounded-xl text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold" />
                <span className="text-slate-600">Assigned: {activeEmergency.hospitalName}</span>
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
const HospitalsView = ({ hospitals: displayHospitals, onRefresh, isRefreshing }: { hospitals: HospitalData[], onRefresh: () => void, isRefreshing: boolean }) => {
  const [sortBy, setSortBy] = useState<'distance' | 'beds' | 'waitTime'>('distance');
  const [isSortOpen, setIsSortOpen] = useState(false);

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
    const url = `https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=${h.lat},${h.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-display font-bold mb-2">Nearby Hospitals</h2>
          <p className="text-slate-500">Top facilities by proximity—ready to wire to live capacity APIs.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`px-6 py-3 glass rounded-2xl flex items-center gap-2 text-sm font-bold transition-all ${isRefreshing ? 'opacity-50 cursor-wait' : 'hover:bg-slate-50'}`}
          >
            <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Refresh'}
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="px-6 py-3 glass rounded-2xl flex items-center gap-2 text-sm font-bold hover:bg-slate-50 transition-all min-w-[200px] justify-between"
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
                          : 'text-slate-900 hover:bg-gray-100'
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
                  <p className="text-xs text-slate-500 mt-1">{h.address}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Distance:</span>
                <span className="font-bold">{h.distance}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Drive Time:</span>
                <span className="font-bold">{h.driveTime}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Wait Time:</span>
                <span className="font-bold">{h.waitTime}</span>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500 font-medium">Available Beds:</span>
                <span className="font-bold">{h.beds}</span>
              </div>
              <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
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
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gold text-slate-900 font-bold text-sm hover:bg-gold/90 transition-all active:scale-95"
              >
                <Navigation className="w-4 h-4" />
                View Route
              </button>
              <button className="flex items-center justify-center gap-2 py-3 rounded-xl glass hover:bg-slate-50 transition-all text-sm font-bold">
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
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-gold/30"
          />
        </div>
        
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-slate-100/50 text-white' 
                : 'text-slate-500 hover:text-white hover:bg-slate-50'
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
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Account Profile</h4>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                    {user?.initials || '??'}
                  </div>
                  <div>
                    <p className="font-bold">{user?.name || 'Guest User'}</p>
                    <p className="text-xs text-slate-500">{user?.email || 'Please log in to see details'}</p>
                  </div>
                </div>
                <button className="px-4 py-2 glass rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                  Edit Profile <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 group hover:border-gold/30 transition-all">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Age</p>
                  <input 
                    type="text" 
                    value={user?.age || '24 Years'} 
                    onChange={(e) => onUpdateUser({ age: e.target.value })}
                    className="bg-transparent font-bold text-white border-none focus:outline-none w-full" 
                  />
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 group hover:border-gold/30 transition-all">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Blood Group</p>
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
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Preferences</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <p className="font-bold text-sm">Sync layouts across windows</p>
                    <p className="text-xs text-slate-500">When enabled, all windows share the same layout</p>
                  </div>
                  <div 
                    onClick={() => onUpdateUser({ syncLayouts: !user?.syncLayouts })}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                      user?.syncLayouts ? 'bg-gold' : 'bg-slate-100/50'
                    }`}
                  >
                    <motion.div 
                      animate={{ x: user?.syncLayouts ? 24 : 4 }}
                      initial={false}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg" 
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <p className="font-bold text-sm">Status Bar</p>
                    <p className="text-xs text-slate-500">Show real-time status bar in dashboard</p>
                  </div>
                  <div 
                    onClick={() => onUpdateUser({ showStatusBar: !user?.showStatusBar })}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                      user?.showStatusBar ? 'bg-gold' : 'bg-slate-100/50'
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
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Past Hospitals Visited</h4>
              <div className="space-y-4">
                {[
                  { name: "SSG Hospital", date: "Mar 12, 2026", reason: "Routine Checkup" },
                  { name: "Sterling Hospital", date: "Jan 05, 2026", reason: "Emergency - Fracture" },
                  { name: "Apollo Hospital", date: "Nov 22, 2025", reason: "Consultation" }
                ].map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{h.name}</p>
                        <p className="text-xs text-slate-500">{h.reason}</p>
                      </div>
                    </div>
                    <p className="text-xs font-mono text-slate-400">{h.date}</p>
                  </div>
                ))}
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
      <p className="text-slate-500 text-lg">Revolutionizing emergency response through deep integration and real-time intelligence.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="glass p-10 rounded-[40px] border-blue-100 gold-glow">
        <p className="text-xl leading-relaxed text-slate-800">
          The GoldenHour Dispatch project was conceived to eliminate the critical delays in emergency triage that often cost lives. By seamlessly connecting vision-based accident classification with real-time hospital operational data, we've created a first-of-its-kind ecosystem where the right care is identified before the ambulance even reaches the scene.
        </p>
      </div>

      <div className="glass p-10 rounded-[40px] border-blue-100 gold-glow">
        <p className="text-xl leading-relaxed text-slate-800">
          In the healthcare sector, our system serves as a force multiplier for dispatchers and medical professionals alike. By automating the identification of trauma levels and providing instant, live updates on ICU bed availability and specialized unit status, we ensure that every critical patient is routed to the facility most capable of saving them, significantly reducing wait times and improving overall survival rates across the regional network.
        </p>
      </div>
    </div>
  </motion.div>
);

// --- Landing Page Components ---
const Hero = ({ setView }: { setView: (v: View) => void }) => {
  const [showTriageForm, setShowTriageForm] = useState(false);
  const [vitals, setVitals] = useState({ hr: 80, bp: '120/80', spo2: 98 });
  const [photo, setPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [traumaDetected, setTraumaDetected] = useState<boolean | null>(null);
  const [sceneAnalysis, setSceneAnalysis] = useState<{
    brief: string,
    risks: string[],
    impact: string
  } | null>(null);

  const handleTriggerAlert = () => {
    setShowTriageForm(true);
  };

  const handlePhotoUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhoto(ev.target?.result as string);
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setTraumaDetected(true);
        setSceneAnalysis({
          brief: "Multiple-vehicle collision detected with significant structural deformation. High-velocity impact indicators found.",
          risks: ["Fuel Leakage Risk", "Entrapment Likely", "Low Visibility Zone"],
          impact: "88/100 (Critical Kinetic Energy)"
        });
      }, 2000);
    };
    reader.readAsDataURL(file);
  };

  const [isDispatching, setIsDispatching] = useState(false);

  const handleFinalDispatch = () => {
    setIsDispatching(true);
    
    const triggerRedirect = (lat?: number, lng?: number) => {
      const params = new URLSearchParams({
        emergency: traumaDetected ? 'head' : 'manual_alert',
        hr: vitals.hr.toString(),
        bp: vitals.bp,
        spo2: vitals.spo2.toString()
      });
      if (lat && lng) {
        params.append('lat', lat.toString());
        params.append('lng', lng.toString());
      }
      window.location.href = `http://localhost:5173?${params.toString()}`;
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => triggerRedirect(pos.coords.latitude, pos.coords.longitude),
        () => triggerRedirect(), // Fallback if denied
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      triggerRedirect();
    }
  };

  return (
    <div className="py-20 flex flex-col items-center text-center">
      <AnimatePresence>
        {showTriageForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
            <div className="max-w-2xl w-full glass rounded-[40px] p-12 border-gold/20 text-left gold-glow overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-display font-bold">Quick Triage Check</h2>
                <button onClick={() => setShowTriageForm(false)} className="text-slate-500 hover:text-white transition-colors">
                  <ArrowLeft className="w-6 h-6 rotate-90" />
                </button>
              </div>
              
              <div className="space-y-6 mb-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Heart Rate (BPM)</label>
                    <input 
                      type="number" 
                      value={vitals.hr} 
                      onChange={(e) => setVitals(prev => ({ ...prev, hr: parseInt(e.target.value) }))}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-bold focus:outline-none focus:border-gold/30 transition-all text-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Blood Pressure</label>
                    <input 
                      type="text" 
                      value={vitals.bp} 
                      onChange={(e) => setVitals(prev => ({ ...prev, bp: e.target.value }))}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-bold focus:outline-none focus:border-gold/30 transition-all text-gold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SpO2 Level (%)</label>
                  <input 
                    type="number" 
                    value={vitals.spo2} 
                    onChange={(e) => setVitals(prev => ({ ...prev, spo2: parseInt(e.target.value) }))}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-bold focus:outline-none focus:border-gold/30 transition-all text-gold"
                  />
                </div>

                {/* Scene Photo Section */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Scene Photo Analysis</label>
                  {!photo ? (
                    <label className="flex flex-col items-center justify-center gap-3 w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-all group">
                      <Smartphone className="w-8 h-8 text-white/20 group-hover:text-gold transition-colors" />
                      <span className="text-xs font-bold text-slate-500 tracking-wide">Upload Accident Photo for AI Scan</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-gold/20 p-2">
                        <img src={photo} className="w-full h-48 object-cover rounded-xl" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                          {isAnalyzing ? (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-10 h-10 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
                              <span className="text-sm font-bold text-gold animate-pulse tracking-widest">SCANNING...</span>
                            </div>
                          ) : traumaDetected && (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="bg-red-500 text-white px-4 py-2 rounded-full font-black text-[10px] tracking-widest flex items-center gap-2 shadow-lg"
                            >
                               <AlertTriangle className="w-3 h-3" />
                               TRAUMA DETECTED
                            </motion.div>
                          )}
                        </div>
                      </div>
                      
                      {sceneAnalysis && !isAnalyzing && (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-slate-900 border border-white/10 p-5 rounded-2xl flex flex-col justify-center"
                        >
                          <div className="flex items-center gap-3 mb-4">
                             <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                                <Zap className="w-4 h-4" />
                             </div>
                             <p className="text-[10px] font-bold text-gold uppercase tracking-widest">AI Observation Brief</p>
                          </div>
                          
                          <p className="text-white text-xs leading-relaxed mb-4 font-medium">{sceneAnalysis.brief}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {sceneAnalysis.risks.map((r, i) => (
                              <span key={i} className="px-2 py-1 bg-red-500/10 text-red-400 text-[8px] font-bold rounded-lg border border-red-500/20">{r}</span>
                            ))}
                          </div>
                          
                          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                            <span className="text-[9px] text-white/40 font-bold uppercase">Localized Impact</span>
                            <span className="text-gold font-bold text-xs">{sceneAnalysis.impact}</span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={handleFinalDispatch}
                disabled={isAnalyzing || isDispatching}
                className={`w-full py-5 bg-gold text-slate-900 font-black rounded-[24px] transition-all flex items-center justify-center gap-3 text-lg shadow-[0_0_40px_rgba(255,215,0,0.2)] ${isAnalyzing || isDispatching ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
              >
                {isDispatching ? (
                  <>
                    <div className="w-5 h-5 border-4 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
                    Acquiring GPS Signal...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 fill-black" />
                    Initialize Tactical Dispatch
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        className="text-xl text-slate-500 max-w-2xl mb-12 leading-relaxed"
      >
        GoldenHour Dispatch uses advanced AI to detect accidents and route ambulances in real-time. 
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
          className="px-8 py-4 bg-red-600 text-white font-black rounded-2xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse"
        >
          TRIGGER SOS
        </button>
        <button 
          onClick={() => setView('manual')}
          className="px-8 py-4 glass rounded-2xl font-bold hover:bg-slate-50 transition-all"
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
          className="p-8 glass rounded-3xl border-slate-200 hover:border-gold/20 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold mb-6 group-hover:scale-110 transition-transform">
            {f.icon}
          </div>
          <h4 className="text-xl font-bold mb-3">{f.title}</h4>
          <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
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
        <div key={i} className="p-8 glass rounded-3xl border-slate-200">
          <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center ${s.color} mb-6`}>
            <Ambulance className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-1">{s.label}</p>
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
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-gold/30 transition-all"
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="mb-10">
        <h2 className="text-4xl font-display font-bold mb-2">User Roles & Incident Reporting</h2>
        <p className="text-slate-500">Capture critical data for emergency response and hospital coordination.</p>
      </div>

      {/* Incident Report (ETM) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[32px] p-8 border-slate-200 relative overflow-hidden"
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incident Description</label>
            <textarea 
              placeholder="What actually happened to the injured person?"
              value={formData.incidentDescription}
              onChange={(e) => handleInputChange('incidentDescription', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-gold/30 transition-all h-32 resize-none"
            />
          </div>
        </div>

        {error.incident && (
          <p className="text-red-500 text-xs mb-4 font-medium">{error.incident}</p>
        )}

        <button 
          onClick={() => handleSubmit('incident', ['hospitalPerson', 'timeReported', 'incidentDescription'])}
          className="w-full py-4 bg-gold text-slate-900 font-bold rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
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
        className="glass rounded-[32px] p-8 border-slate-200"
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</label>
            <textarea 
              placeholder="Enter full address"
              value={formData.personAddress}
              onChange={(e) => handleInputChange('personAddress', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-gold/30 transition-all h-24 resize-none"
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
        className="glass rounded-[32px] p-8 border-slate-200"
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

  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  const handleServicesClick = (id: string) => {
    setPendingRedirect(id);
    
    // Explicitly trigger browser's native location prompt
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("GPS Signal Lock Acquired:", position.coords);
          // Redirect with the acquired context
          setTimeout(() => {
            window.location.href = `http://localhost:5173/?emergency=${id}&lat=${position.coords.latitude}&lng=${position.coords.longitude}`;
          }, 1500); // 1.5s visual confirmation
        },
        (error) => {
          console.warn("GPS Signal Denied, proceeding with default Pune location data:", error);
          setTimeout(() => {
            window.location.href = `http://localhost:5173/?emergency=${id}`;
          }, 1500);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setTimeout(() => {
        window.location.href = `http://localhost:5173/?emergency=${id}`;
      }, 1500);
    }
  };

  const selectedGuide = guides.find(g => g.id === selectedId);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <AnimatePresence>
        {pendingRedirect && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
            <div className="max-w-xl w-full glass rounded-[40px] p-12 border-gold/20 text-center gold-glow">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center text-gold mx-auto mb-8 border border-gold/20"
              >
                <MapPin className="w-12 h-12" />
              </motion.div>
              <h2 className="text-4xl font-display font-bold mb-4">Enable Location</h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                We need your GPS coordinates to dispatch the nearest ambulance immediately. 
                Please ensure location services are enabled on your device.
              </p>
              <div className="flex items-center justify-center gap-3 text-gold font-bold">
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                <span className="uppercase tracking-[0.2em] text-sm">Authorizing Signal...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <h3 className="text-xl font-bold text-slate-600">What happened? Select a situation:</h3>
            </div>
            {guides.map((guide) => (
              <div
                key={guide.id}
                className="glass rounded-[32px] p-8 border-slate-200 hover:border-gold/20 transition-all group relative overflow-hidden flex items-center gap-6"
              >
                {/* Information Layer */}
                <div className="flex items-center gap-6 w-full group-hover:opacity-10 transition-opacity duration-300">
                  <div className={`w-16 h-16 rounded-2xl ${guide.bg} flex items-center justify-center ${guide.color} group-hover:scale-110 transition-transform shrink-0`}>
                    {guide.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">{guide.title.en}</h4>
                    <p className="text-sm text-slate-500">Hover for options</p>
                  </div>
                </div>

                {/* Hover Action Layer */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4 p-6 translate-y-4 group-hover:translate-y-0">
                  <button 
                    onClick={() => setSelectedId(guide.id)}
                    className="w-full py-3 bg-slate-100/50 hover:bg-white/20 border border-slate-200 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Read Manual
                  </button>
                  <button 
                    onClick={() => handleServicesClick(guide.id)}
                    className="w-full py-3 bg-gold text-slate-900 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                  >
                    <Phone className="w-4 h-4" />
                    Emergency Services
                  </button>
                </div>
              </div>
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
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3">Select Language</span>
                <select 
                  value={lang}
                  onChange={(e) => setLang(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gold/30 transition-all cursor-pointer"
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
                className="glass rounded-[40px] p-10 border-slate-200 gold-glow"
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
                      className="flex items-start gap-6 p-6 rounded-3xl bg-slate-50 border border-slate-200"
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
        <p className="text-slate-600 text-sm leading-relaxed">
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
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-500 hover:text-white">
          <ArrowLeft className="w-5 h-5 rotate-90" />
        </button>

        <h3 className="text-3xl font-display font-bold mb-2">{isSignUp ? 'Join GoldenHour Dispatch' : 'Welcome Back'}</h3>
        <p className="text-sm text-slate-500 mb-8 border-b border-slate-200 pb-4">
          {isSignUp ? 'Create an account to start dispatching' : 'Access your professional dashboard'}
        </p>

        <div className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-gold/30 transition-all font-medium"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Email Address</label>
            <input 
              type="email" 
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-gold/30 transition-all font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-gold/30 transition-all font-medium"
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
          className="w-full py-4 bg-gold text-slate-900 font-black rounded-2xl mt-8 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)]"
        >
          {isSignUp ? 'Create Account' : 'Sign In'}
        </button>

        <p className="text-center text-xs text-slate-500 mt-6">
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications] = useState([
    { id: 1, title: 'Ambulance GJ-06 arrived', time: '2m ago', type: 'info' },
    { id: 2, title: 'Hospital Diverting Alert', time: '15m ago', type: 'warning' },
    { id: 3, title: 'New Emergency Reported', time: '1h ago', type: 'critical' },
  ]);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
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

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000); 
    return () => clearInterval(interval);
  }, []);

  const filteredHospitals = hospitals.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    h.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar currentView={view} setView={setView} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        {/* Header - Only show for non-landing views or as a floating bar */}
        {view !== 'landing' && (
          <header className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-display font-bold mb-1 capitalize text-slate-900">
                {view}
              </h1>
              <p className="text-slate-500 text-sm">
                {currentUser ? `Welcome back, ${currentUser.name}` : 'Welcome to Golden Root Dispatch'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {currentUser ? (
                <div 
                  className="h-12 px-2 flex items-center gap-3 bg-white shadow-sm rounded-2xl border border-slate-200 hover:border-blue-400 transition-all cursor-pointer group"
                  onClick={() => setView('settings')}
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    {currentUser.initials}
                  </div>
                  <span className="text-sm font-bold pr-2 group-hover:text-blue-600 transition-colors text-slate-800">{currentUser.name.split(' ')[0]}</span>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl hover:scale-105 transition-transform shadow-lg text-sm"
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
                <div className="bg-white rounded-[40px] p-12 border border-slate-200 shadow-xl overflow-hidden relative">
                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="lg:w-1/2">
                      <h2 className="text-6xl font-display font-bold mb-6 leading-tight text-slate-900">Live Response <br /><span className="text-blue-600">Network</span></h2>
                      <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-lg">
                        Our proprietary network connects every emergency asset in the city. 
                        Real-time data visualization allows for split-second decision making and instant hospital orchestration.
                      </p>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => window.location.href = 'http://localhost:5173'}
                          className="px-10 py-5 bg-blue-600 text-white font-black rounded-2xl hover:scale-105 transition-all shadow-xl flex items-center gap-3 group"
                        >
                          <Ambulance className="w-5 h-5 group-hover:animate-bounce" />
                          Call Ambulance
                        </button>
                        <button 
                          onClick={() => setView('manual')}
                          className="px-8 py-5 bg-slate-100 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm uppercase tracking-widest text-slate-600"
                        >
                          Guide
                        </button>
                      </div>
                    </div>
                    <div 
                      className="lg:w-1/2 h-[450px] rounded-[40px] bg-slate-50 border border-slate-200 shadow-inner overflow-hidden relative cursor-pointer group/map"
                      onClick={() => window.location.href = 'http://localhost:5173'}
                    >
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=2006&auto=format&fit=crop')] bg-cover opacity-10 grayscale group-hover:opacity-20 transition-opacity" />
                       <MiniMapPreview emergencies={emergencies} />
                    </div>
                  </div>
                </div>
              </div>
              <footer className="py-20 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center text-slate-900 shadow-lg shadow-blue-100/30">
                        <Activity className="w-6 h-6" />
                      </div>
                      <span className="text-2xl font-display font-bold text-gold tracking-tight">GoldenHour Dispatch</span>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed italic">
                      "Arogyam Dhansampada" — Health is the true wealth. We are committed to preserving it through speed and technology.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-gold font-bold uppercase tracking-widest text-xs">Safety First</h4>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3 text-sm text-slate-600">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                        <span>Don't drink and drive. Your life and others' are worth more than a glass.</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-slate-600">
                        <Shield className="w-5 h-5 text-gold shrink-0" />
                        <span>Speed thrills but kills. Better late than never.</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-slate-600">
                        <Smartphone className="w-5 h-5 text-blue-400 shrink-0" />
                        <span>Eyes on the road, not on the screen. Avoid distractions while driving.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-gold font-bold uppercase tracking-widest text-xs">Health Thoughts</h4>
                    <div className="p-6 glass rounded-2xl border-blue-100">
                      <p className="text-sm text-slate-800 italic leading-relaxed">
                        "The greatest of follies is to sacrifice health for any other kind of happiness."
                      </p>
                      <p className="text-[10px] text-gold font-bold mt-4 uppercase">— Arthur Schopenhauer</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
                  <p className="text-xs text-white/20">© 2026 GoldenHour Dispatch Emergency Systems. All rights reserved.</p>
                  <div className="flex gap-8 text-xs text-slate-500">
                    <a href="#" className="hover:text-gold transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-gold transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-gold transition-colors">Contact Support</a>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}
          {view === 'hospitals' && (
            <motion.div
              key="hospitals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <HospitalsView hospitals={filteredHospitals} onRefresh={fetchDashboardData} isRefreshing={isRefreshing} />
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
      <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[10%] w-[40%] h-[40%] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none" />

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
