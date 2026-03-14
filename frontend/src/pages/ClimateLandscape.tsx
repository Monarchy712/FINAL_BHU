import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Wind, CloudRain, Thermometer, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import cityLandscapeData from '../data/city_landscape_data.json';

// --- Types ---
interface CityData {
  city: string;
  country: string;
  avg_temp: number;
  avg_precip: number;
  avg_press: number;
  climate_cluster: string;
  temp_trend: 'increasing' | 'stable' | 'decreasing';
}

interface MousePos {
  x: number;
  y: number;
}

// --- Rain Effect Component ---
interface RainEffectProps {
  intensity: number;
  active: boolean;
}

const RainEffect: React.FC<RainEffectProps> = ({ intensity, active }) => {
  if (!active || intensity < 700) return null;
  const dropCount = Math.floor((intensity - 600) / 4);
  
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {[...Array(dropCount)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: Math.random() * 100 + "%", opacity: 0.4 }}
          animate={{ y: "110vh" }}
          transition={{
            duration: 0.8 + Math.random() * 0.5,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "linear"
          }}
          className="absolute w-[1px] h-10 bg-cyan-100/30"
        />
      ))}
    </div>
  );
};

// --- Enhanced Wind Component ---
interface WindFlowProps {
  intensity: number;
}

const WindFlow: React.FC<WindFlowProps> = ({ intensity }) => {
  const density = Math.floor(intensity * 30);
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(density)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: -200, y: Math.random() * 100 + "%", opacity: 0 }}
          animate={{ 
            x: "130vw", 
            opacity: [0, 0.5, 0] 
          }}
          transition={{
            duration: 1.5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear"
          }}
          className="absolute h-[1px] bg-white/30 shadow-[0_0_20px_white]"
          style={{ width: Math.random() * 250 + 200 + "px" }}
        />
      ))}
    </div>
  );
};

// --- Cloud Shadows Component ---
const GroundShadows: React.FC = () => {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[40%] pointer-events-none overflow-hidden z-20">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: "-50%", opacity: 0 }}
          animate={{ 
            x: "150%", 
            opacity: [0, 0.15, 0.15, 0],
            scale: [1, 1.2, 0.9, 1.1] 
          }}
          transition={{
            duration: 20 + Math.random() * 15,
            repeat: Infinity,
            delay: i * 7,
            ease: "linear"
          }}
          className="absolute top-0 w-[600px] h-[300px] bg-black/40 blur-[120px] rounded-full"
          style={{ top: `${Math.random() * 50}%` }}
        />
      ))}
    </div>
  );
};

// --- Realistic Cinematic Cloud Component ---
interface RealisticCloudProps {
  scale: number;
  x: number;
  y: number;
  duration: number;
}

const RealisticCloud: React.FC<RealisticCloudProps> = ({ scale, x, y, duration }) => (
  <motion.div 
    animate={{ x: [x - 2, x + 2, x - 2] }}
    transition={{ duration: duration, repeat: Infinity, ease: 'easeInOut' }}
    className="absolute pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%`, scale }}
  >
    <svg width="280" height="120" viewBox="0 0 280 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_15px_45px_rgba(0,0,0,0.15)] opacity-90">
      <defs>
        <radialGradient id={`cloudGrad-${x}-${y}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.45" />
          <stop offset="100%" stopColor="white" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="70" r="45" fill={`url(#cloudGrad-${x}-${y})`} />
      <circle cx="140" cy="60" r="55" fill={`url(#cloudGrad-${x}-${y})`} />
      <circle cx="200" cy="70" r="45" fill={`url(#cloudGrad-${x}-${y})`} />
      <rect x="60" y="65" width="160" height="40" rx="20" fill="white" fillOpacity="0.15" />
    </svg>
  </motion.div>
);

// --- Real-Time Pinned Data Panel ---
interface DataPanelProps {
  title: string;
  data: Record<string, string>;
  icon: any;
  visible: boolean;
  colorTheme?: 'default' | 'hot' | 'rainy';
  mousePos: MousePos;
  suppressed: boolean;
}

const DataPanel: React.FC<DataPanelProps> = ({ title, data, icon: Icon, visible, colorTheme = "default", mousePos, suppressed }) => {
  const themeStyles = useMemo(() => {
    switch (colorTheme) {
      case "hot": return { border: "border-orange-500/40", accent: "text-orange-400", bg: "bg-orange-950/75" };
      case "rainy": return { border: "border-cyan-500/40", accent: "text-cyan-400", bg: "bg-cyan-950/75" };
      default: return { border: "border-slate-500/40", accent: "text-slate-200", bg: "bg-slate-900/85" };
    }
  }, [colorTheme]);

  return (
    <AnimatePresence>
      {visible && !suppressed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`fixed z-[4000] p-6 rounded-[2.5rem] border backdrop-blur-[60px] shadow-[0_60px_120px_rgba(0,0,0,0.8)] min-w-[300px] pointer-events-none transition-none ${themeStyles.border} ${themeStyles.bg}`}
          style={{ 
            left: mousePos.x, 
            top: mousePos.y - 40,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className={`flex items-center gap-3 mb-5 ${themeStyles.accent}`}>
            <Icon size={24} className="drop-shadow-[0_0_10px_currentColor]" />
            <span className="text-[14px] font-black uppercase tracking-[0.35em]">{title}</span>
          </div>
          <div className="space-y-4">
            {Object.entries(data).map(([label, value]) => (
              <div key={label} className="flex justify-between items-center border-b border-white/5 last:border-0 pb-2 last:pb-0">
                <span className="text-[11px] text-white/40 font-black uppercase tracking-widest">{label}</span>
                <span className="text-base font-mono font-bold text-white tracking-tight">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function ClimateLandscape() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityData>((cityLandscapeData as CityData[])[0]);
  const [hoverZone, setHoverZone] = useState<'sky' | 'aerial' | 'surface' | null>(null);
  const [mousePos, setMousePos] = useState<MousePos>({ x: 0, y: 0 });
  const [suppressed, setSuppressed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(!!location.state?.mlModalMode);

  useEffect(() => {
    if (isAnalyzing) {
      const timer = setTimeout(() => setIsAnalyzing(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [isAnalyzing]);

  const isOverUI = useRef(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    
    if (isOverUI.current) {
        setHoverZone(null);
        return;
    }

    const yPercent = (e.clientY / window.innerHeight) * 100;
    let zone: 'sky' | 'aerial' | 'surface' | null = null;
    
    if (yPercent < 35) zone = 'sky';
    else if (yPercent < 65) zone = 'aerial';
    else zone = 'surface';

    setHoverZone(zone);
  };

  const handleCitySelect = (city: CityData) => {
    setSelectedCity(city);
    setSearch('');
    setSuppressed(false);
    isOverUI.current = false;
  };

  const suggestions = useMemo(() => {
    if (!search) return [];
    return (cityLandscapeData as CityData[])
      .filter(c => c.city.toLowerCase().startsWith(search.toLowerCase()))
      .slice(0, 5);
  }, [search]);

  const sceneStyles = useMemo(() => {
    const isHot = selectedCity.avg_temp > 28;
    const isRainy = selectedCity.avg_precip > 800;
    return {
      sky: isHot ? 'from-amber-600 via-orange-500 to-orange-200' : 
            isRainy ? 'from-slate-800 via-slate-700 to-blue-400' :
            'from-cyan-800 via-blue-600 to-cyan-50',
      sunIntensity: isHot ? 1.6 : isRainy ? 0.2 : 1.1
    };
  }, [selectedCity]);

  const zoneData = useMemo(() => {
    const precipLabel = `${Math.round(selectedCity.avg_precip).toLocaleString()} mm/yr`;
    const tempLabel = `${selectedCity.avg_temp}°C`;
    const pressLabel = `${selectedCity.avg_press} mb`;
    const clusterLabel = selectedCity.climate_cluster;
    const trendLabel = selectedCity.temp_trend;

    if (hoverZone === 'sky') return { 
      title: "Sky Matrix", icon: CloudRain, 
      theme: (selectedCity.avg_precip > 1200 ? "rainy" : "default") as any,
      data: { 
        "Climate Type": clusterLabel, 
        "Annual Precip": precipLabel,
        "Pressure": pressLabel 
      } as Record<string, string>
    };
    if (hoverZone === 'aerial') return { 
      title: "Aerial Matrix", icon: Wind, 
      theme: "default" as any,
      data: { 
        "Atm. Pressure": pressLabel, 
        "Temp Trend": trendLabel,
        "Climate": clusterLabel 
      } as Record<string, string>
    };
    if (hoverZone === 'surface') return { 
      title: "Surface Report", icon: Thermometer, 
      theme: (selectedCity.avg_temp > 28 ? "hot" : "default") as any,
      data: { 
        "Avg Temp": tempLabel, 
        "Pressure": pressLabel,
        "Annual Precip": precipLabel 
      } as Record<string, string>
    };
    return null;
  }, [hoverZone, selectedCity]);

  return (
    <div 
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverZone(null)}
      className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100 font-sans cursor-default"
    >
      
      {/* ML Processing Modal Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl"
          >
            <div className="relative w-full max-w-2xl h-[300px] my-4 rounded-3xl overflow-hidden"
                 style={{ background: 'rgba(100,255,218,0.03)', border: '1px solid rgba(100,255,218,0.15)' }}>
              <p className="absolute top-5 left-6 text-sm font-display text-portal-neon/60 tracking-[0.3em] uppercase">
                Initializing Landscape AI Protocol
              </p>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 480" preserveAspectRatio="xMidYMid meet">
                {/* Edges */}
                {[[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[0,3],[1,4],[2,5],[3,6],[4,7],[5,8],[0,11],[1,11],[2,11],[11,4]].map(([a, b], i) => {
                  const nodes = [
                    { cx: 200, cy: 160 }, { cx: 400, cy: 80 },  { cx: 620, cy: 140 },
                    { cx: 150, cy: 300 }, { cx: 350, cy: 260 }, { cx: 550, cy: 320 },
                    { cx: 250, cy: 420 }, { cx: 480, cy: 400 }, { cx: 680, cy: 380 },
                    { cx: 100, cy: 180 }, { cx: 720, cy: 200 }, { cx: 450, cy: 180 },
                  ];
                  return (
                  <line key={i}
                    x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy}
                    stroke="rgba(100,255,218,0.3)" strokeWidth="1.5"
                    style={{ animation: `edgePulse ${1.5 + i * 0.1}s ease-in-out ${i * 0.08}s infinite alternate` }}
                  />
                )})}
                {/* Nodes */}
                {[...Array(12)].map((_, i) => {
                  const nodes = [
                    { cx: 200, cy: 160 }, { cx: 400, cy: 80 },  { cx: 620, cy: 140 },
                    { cx: 150, cy: 300 }, { cx: 350, cy: 260 }, { cx: 550, cy: 320 },
                    { cx: 250, cy: 420 }, { cx: 480, cy: 400 }, { cx: 680, cy: 380 },
                    { cx: 100, cy: 180 }, { cx: 720, cy: 200 }, { cx: 450, cy: 180 },
                  ];
                  const n = nodes[i];
                  return (
                  <g key={i}>
                    <circle cx={n.cx} cy={n.cy} r="18" fill="rgba(100,255,218,0.08)"
                      stroke={i < 4 ? '#64ffda' : '#00f0ff'} strokeWidth="1.5"
                      style={{ animation: `nodePulse ${2 + i * 0.15}s ease-in-out ${i * 0.12}s infinite alternate` }}
                    />
                    <circle cx={n.cx} cy={n.cy} r="5" fill={i < 4 ? '#64ffda' : '#00f0ff'}
                      style={{ filter: `drop-shadow(0 0 6px ${i < 4 ? '#64ffda' : '#00f0ff'})` }} />
                  </g>
                )})}
              </svg>
              {/* Processing label */}
              <div className="absolute bottom-5 right-6 flex items-center gap-3">
                <Loader2 size={16} className="text-portal-neon animate-spin" />
                <span className="text-sm font-mono text-portal-neon/80 tracking-wider">Generating 3D topographies...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {zoneData && (
        <DataPanel 
          title={zoneData.title}
          icon={zoneData.icon}
          visible={!!hoverZone}
          mousePos={mousePos}
          suppressed={suppressed}
          colorTheme={zoneData.theme}
          data={zoneData.data}
        />
      )}

      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute inset-0 bg-gradient-to-b ${sceneStyles.sky} transition-colors duration-[4000ms]`} />
        <RainEffect intensity={selectedCity.avg_precip} active={true} />
        <WindFlow intensity={hoverZone ? 3.5 : 1.5} />
        <GroundShadows />
        
        <div className="absolute top-[8%] left-0 w-full h-[32%] z-10 overflow-hidden">
            <RealisticCloud scale={1.2} x={10} y={5} duration={18} />
            <RealisticCloud scale={0.9} x={45} y={0} duration={25} />
            <RealisticCloud scale={1.5} x={80} y={4} duration={20} />
            {selectedCity.avg_precip > 800 && <RealisticCloud scale={1.1} x={25} y={15} duration={14} />}
        </div>

        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-10 right-[15%] w-96 h-96 bg-white rounded-full blur-[150px] mix-blend-screen"
          style={{ opacity: 0.4 * sceneStyles.sunIntensity }}
        />

        <div className="absolute bottom-0 w-full h-[45%] z-20">
           <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-emerald-950 via-emerald-900/50 to-transparent" />
           <div className="absolute inset-x-0 bottom-0 h-full flex items-end justify-around px-5">
              {[...Array(160)].map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ rotate: [-5, 5, -5] }}
                  transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-[2.5px] bg-emerald-500/30 rounded-full origin-bottom"
                  style={{ height: `${50 + Math.random() * 120}px`, opacity: 0.3 + Math.random() * 0.3 }}
                />
              ))}
           </div>
           <svg viewBox="0 0 1440 600" className="absolute bottom-0 w-full h-full fill-slate-900/10 opacity-75">
              <path d="M0,450L180,380C360,310,720,170,1080,170C1440,170,1620,310,1800,380L1980,450L1980,600L0,600Z" />
              <path d="M0,500L240,440C480,380,960,260,1440,260C1920,260,2160,380,2400,440L2640,500L2640,600L0,600Z" fill="green" fillOpacity="0.18" />
           </svg>
        </div>
      </div>

      <div className="relative z-[5000] p-10 h-screen flex flex-col pointer-events-none">
        <div className="flex justify-between items-start pointer-events-auto">
          
          <div 
            className="flex items-center gap-6"
            onMouseEnter={() => { setSuppressed(true); isOverUI.current = true; setHoverZone(null); }}
            onMouseLeave={() => { setSuppressed(false); isOverUI.current = false; }}
          >
            <button onClick={() => navigate('/researchers')} className="p-5 rounded-3xl bg-slate-900/40 backdrop-blur-3xl border border-white/40 hover:bg-white/10 transition-all text-white shadow-2xl"><ArrowLeft size={24} /></button>
            <div className="space-y-1.5 py-1">
              <div className="flex items-center gap-3">
                 <h2 className="text-2xl font-black text-white italic drop-shadow-xl">{selectedCity.city}</h2>
                 <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] uppercase text-cyan-400 font-bold tracking-widest">{selectedCity.country}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white opacity-60 font-mono">System Monitor</p>
            </div>
          </div>

          <div 
            className="relative group w-full max-w-sm"
            onMouseEnter={() => { setSuppressed(true); isOverUI.current = true; setHoverZone(null); }}
            onMouseLeave={() => { setSuppressed(false); isOverUI.current = false; }}
          >
            <div className="absolute inset-y-0 left-6 flex items-center text-cyan-300"><Search size={18} /></div>
            <input 
              type="text" 
              placeholder="Locate Coordinate..." 
              className="w-full bg-white/10 backdrop-blur-3xl border border-white/30 rounded-[2rem] py-5 pl-16 pr-8 outline-none text-white font-bold shadow-2xl focus:bg-white/20 transition-all" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-[115%] left-0 w-full bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-[6000]">
                  {suggestions.map(c => (
                    <button key={c.city} onClick={() => handleCitySelect(c as CityData)} className="w-full px-8 py-4 text-left hover:bg-white/10 text-sm font-bold border-b border-white/5 last:border-0">{c.city}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div 
          className="mt-auto ml-auto pointer-events-auto"
          onMouseEnter={() => { setSuppressed(true); isOverUI.current = true; setHoverZone(null); }}
          onMouseLeave={() => { setSuppressed(false); isOverUI.current = false; }}
        >
           <motion.div key={selectedCity.temp_trend} className="bg-slate-900/40 backdrop-blur-3xl px-6 py-4 rounded-3xl flex items-center gap-5 border border-white/20 shadow-2xl">
              <div className="flex flex-col items-end">
                 <span className="text-sm font-black text-white italic tracking-tighter">{selectedCity.climate_cluster}</span>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${selectedCity.temp_trend === 'increasing' ? 'bg-red-500' : 'bg-emerald-400'} animate-pulse shadow-[0_0_15px_currentColor]`} />
           </motion.div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.glass-card-sharp { background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(50px) saturate(200%); border: 1px solid rgba(255, 255, 255, 0.25); }`}} />
    </div>
  );
}
