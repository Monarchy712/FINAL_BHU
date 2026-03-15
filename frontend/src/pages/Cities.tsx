import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, MapPin, Thermometer, Wind, Cloud, TrendingUp, ChevronLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';


/* ── Similarity Colour System ────────────────────────────────── */
const getSimilarityColor = (sim: number) => {
  if (sim >= 90) return { text: '#00ff88', glow: 'rgba(0,255,136,0.5)', border: 'rgba(0,255,136,0.6)', label: 'Very Similar' };
  if (sim >= 70) return { text: '#aaee00', glow: 'rgba(170,238,0,0.5)',  border: 'rgba(170,238,0,0.6)',  label: 'High Similarity' };
  if (sim >= 50) return { text: '#ffd700', glow: 'rgba(255,215,0,0.5)',  border: 'rgba(255,215,0,0.5)',  label: 'Moderate' };
  return           { text: '#ffaa44', glow: 'rgba(255,170,68,0.3)',   border: 'rgba(255,170,68,0.4)',  label: 'Low Similarity' };
};

/* ── Animated City Skyline Background ───────────────────────── */
const CityBackground = () => {
  const buildingRows = [
    // far layer — small, dark
    [12,28,18,35,22,40,15,30,25,38,20,45,17,32,27,42,14,36,23,33],
    // mid layer
    [20,48,30,60,38,70,25,55,45,65,28,52,35,62,42,58,32,68,22,50],
    // near layer — tallest
    [35,90,55,110,70,130,45,100,80,120,50,95,65,115,75,105,40,125,60,85],
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* gradient sky */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, rgba(6,14,26,0.95) 0%, #03080f 100%)' }} />

      {/* world grid */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        animation: 'bgRotate 120s linear infinite',
      }} />

      {/* Skyline layers */}
      {buildingRows.map((row, li) => {
        const opacity = [0.12, 0.22, 0.35][li];
        const color = ['rgba(0,240,255', 'rgba(100,255,218', 'rgba(167,139,250'][li];
        const speed = [80, 55, 35][li];
        const blur = [4, 2, 0][li];

        return (
          <div key={li} className="absolute bottom-0 left-0 w-full" style={{ filter: `blur(${blur}px)`, opacity }}>
            <div style={{ display: 'flex', height: '200px', animation: `skylineScroll ${speed}s linear infinite`, width: '400%' }}>
              {[0,1,2,3].map(copy => (
                <div key={copy} style={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
                  {row.map((h, bi) => (
                    <div key={bi} style={{
                      flex: 1, height: `${h}px`,
                      background: `linear-gradient(to top, ${color},0.9) 0%, ${color},0.2) 60%, transparent 100%)`,
                      borderTop: `1px solid ${color},0.6)`,
                      borderLeft: bi % 2 === 0 ? `1px solid ${color},0.3)` : 'none',
                      borderRight: bi % 2 !== 0 ? `1px solid ${color},0.3)` : 'none',
                    }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Floating climate particles */}
      {[...Array(25)].map((_, i) => (
        <div key={i} className="absolute rounded-full" style={{
          width: `${2 + Math.random() * 3}px`, height: `${2 + Math.random() * 3}px`,
          left: `${Math.random() * 100}%`, top: `${Math.random() * 70}%`,
          background: i % 3 === 0 ? '#00f0ff' : i % 3 === 1 ? '#64ffda' : '#a78bfa',
          opacity: 0.3 + Math.random() * 0.3,
          animation: `cityParticleFloat ${8 + Math.random() * 10}s ease-in-out ${Math.random() * 5}s infinite alternate`,
          boxShadow: `0 0 6px currentColor`,
        }} />
      ))}

      {/* Atmospheric glow at city base */}
      <div className="absolute bottom-0 left-0 right-0 h-40" style={{
        background: 'linear-gradient(to top, rgba(167,139,250,0.08) 0%, rgba(0,240,255,0.04) 50%, transparent 100%)',
      }} />
    </div>
  );
};

/* ── ML Processing Visualization ──────────────────────────────── */
const MLProcessingViz = ({ active }: { active: boolean }) => {
  const nodes = [
    { cx: 200, cy: 160 }, { cx: 400, cy: 80 },  { cx: 620, cy: 140 },
    { cx: 150, cy: 300 }, { cx: 350, cy: 260 }, { cx: 550, cy: 320 },
    { cx: 250, cy: 420 }, { cx: 480, cy: 400 }, { cx: 680, cy: 380 },
    { cx: 100, cy: 180 }, { cx: 720, cy: 200 }, { cx: 450, cy: 180 },
  ];
  const edges = [[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[0,3],[1,4],[2,5],[3,6],[4,7],[5,8],[0,11],[1,11],[2,11],[11,4]];

  return (
    <div className={`transition-all duration-700 ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
         style={{ height: active ? '220px' : '0', overflow: 'hidden', transition: 'all 0.7s ease' }}>
      <div className="relative w-full h-[220px] my-4 rounded-2xl overflow-hidden"
           style={{ background: 'rgba(0,240,255,0.02)', border: '1px solid rgba(0,240,255,0.12)' }}>
        <p className="absolute top-3 left-4 text-xs font-display text-portal-teal/60 tracking-widest uppercase">
          AI Similarity Clustering
        </p>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 480" preserveAspectRatio="xMidYMid meet">
          {/* Edges */}
          {edges.map(([a, b], i) => (
            <line key={i}
              x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy}
              stroke="rgba(0,240,255,0.25)" strokeWidth="1"
              style={{ animation: `edgePulse ${1.5 + i * 0.1}s ease-in-out ${i * 0.08}s infinite alternate` }}
            />
          ))}
          {/* Nodes */}
          {nodes.map((n, i) => (
            <g key={i}>
              <circle cx={n.cx} cy={n.cy} r="16" fill="rgba(0,240,255,0.06)"
                stroke={i < 3 ? '#00ff88' : i < 6 ? '#00f0ff' : '#a78bfa'}
                strokeWidth="1.5"
                style={{ animation: `nodePulse ${2 + i * 0.15}s ease-in-out ${i * 0.12}s infinite alternate` }}
              />
              <circle cx={n.cx} cy={n.cy} r="4"
                fill={i < 3 ? '#00ff88' : i < 6 ? '#00f0ff' : '#a78bfa'}
                style={{ filter: `drop-shadow(0 0 4px ${i < 3 ? '#00ff88' : '#00f0ff'})` }}
              />
            </g>
          ))}
          {/* Cluster rings */}
          <ellipse cx="390" cy="220" rx="300" ry="160" fill="none"
            stroke="rgba(100,255,218,0.1)" strokeWidth="1" strokeDasharray="8 6"
            style={{ animation: 'clusterRotate 12s linear infinite' }} />
          <ellipse cx="390" cy="220" rx="160" ry="90" fill="none"
            stroke="rgba(0,255,136,0.15)" strokeWidth="1.5" strokeDasharray="5 8"
            style={{ animation: 'clusterRotate 8s linear infinite reverse' }} />
        </svg>
        {/* Processing label */}
        <div className="absolute bottom-3 right-4 flex items-center gap-2">
          <Loader2 size={12} className="text-portal-teal animate-spin" />
          <span className="text-xs font-display text-portal-teal/60 tracking-wider">Computing climate vectors...</span>
        </div>
      </div>
    </div>
  );
};

const BarIndicator = ({ label, value, max, unit, icon: Icon, color }: any) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={10} style={{ color, flexShrink: 0 }} />
      <span className="text-[0.6rem] text-white/50 font-display tracking-wider w-14 shrink-0">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
             style={{ width: `${percent}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <span className="text-[0.6rem] font-display w-10 text-right whitespace-nowrap" style={{ color }}>{value}{unit}</span>
    </div>
  );
};

/* ── Result City Card ──────────────────────────────────────────── */
const CityCard = ({ data, index, isBest }: any) => {
  const [hovered, setHovered] = useState(false);
  const col = getSimilarityColor(data.sim);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animationDelay: `${index * 120}ms`,
        transform: `perspective(800px) rotateX(${hovered ? -3 : 0}deg) rotateY(${hovered ? 3 : 0}deg) translateY(${hovered ? -10 : isBest ? -6 : 0}px) scale(${hovered ? 1.03 : isBest ? 1.02 : 1})`,
        transition: 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
        background: hovered ? 'rgba(0,240,255,0.07)' : isBest ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? col.border : isBest ? col.border : 'rgba(255,255,255,0.09)'}`,
        boxShadow: hovered
          ? `0 30px 60px rgba(0,0,0,0.6), 0 0 30px ${col.glow}`
          : isBest
          ? `0 20px 50px rgba(0,0,0,0.5), 0 0 20px ${col.glow}`
          : '0 15px 40px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(16px)',
        borderRadius: '1.5rem',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        animation: 'cityCardFadeIn 0.6s ease forwards',
        opacity: 0,
        zIndex: hovered ? 20 : isBest ? 10 : 1,
      } as React.CSSProperties}
    >
      {/* Best match badge */}
      {isBest && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[0.6rem] font-display tracking-widest uppercase"
             style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.4)', color: '#00ff88', boxShadow: '0 0 10px rgba(0,255,136,0.3)' }}>
          Best Match
        </div>
      )}

      {/* Rank */}
      <div className="absolute top-4 left-4 w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold"
           style={{ background: `${col.glow}`, border: `1px solid ${col.border}`, color: col.text }}>
        {index + 1}
      </div>

      {/* City Skyline Icon */}
      <div className="flex justify-center mb-4 mt-1">
        <svg width="100" height="40" viewBox="0 0 100 40" style={{ opacity: 0.7 }}>
          {[8,20,14,30,25,18,35,22,12,28].map((h, i) => (
            <rect key={i} x={i * 10 + 1} y={40 - h} width="8" height={h}
              fill="none" stroke={col.text} strokeWidth="0.8" opacity={0.6 + i*0.04}
              rx="0.5" />
          ))}
          <line x1="0" y1="40" x2="100" y2="40" stroke={col.text} strokeWidth="1" opacity="0.4" />
        </svg>
      </div>

      {/* City name */}
      <div className="text-center mb-3">
        <h3 className="text-xl font-display font-bold tracking-wider" style={{ color: col.text, textShadow: hovered ? `0 0 15px ${col.text}` : 'none' }}>
          {data.city}
        </h3>
        <div className="flex items-center justify-center gap-1 mt-1">
          <MapPin size={10} className="text-white/40" />
          <span className="text-xs text-white/40 font-display tracking-wider">{data.country}</span>
        </div>
      </div>

      {/* Similarity ring */}
      <div className="flex justify-center mb-3">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle cx="40" cy="40" r="32" fill="none" stroke={col.text} strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 32}`}
              strokeDashoffset={`${2 * Math.PI * 32 * (1 - data.sim / 100)}`}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${col.text})`, transition: 'stroke-dashoffset 1.2s ease 0.3s' } as React.CSSProperties} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-display font-black" style={{ color: col.text }}>{data.sim.toFixed(1)}%</span>
            <span className="text-[0.5rem] text-white/40 font-display tracking-widest">MATCH</span>
          </div>
        </div>
      </div>

      {/* Similarity label */}
      <div className="text-center mb-3">
        <span className="text-[0.6rem] font-display tracking-widest uppercase px-3 py-1 rounded-full"
              style={{ background: `${col.glow.replace('0.5','0.12')}`, border: `1px solid ${col.border}`, color: col.text }}>
          {col.label}
        </span>
      </div>

      {/* Hover panel — climate breakdown */}
      <div style={{
        maxHeight: hovered ? '140px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.4s ease',
        marginTop: hovered ? '0.75rem' : 0,
      }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
          <BarIndicator label="Temp"     value={data.temp}      max={45}   unit="°C"  icon={Thermometer} color="#ff6b00" />
          <BarIndicator label="Pressure" value={data.pressure}  max={1050} unit="mb"  icon={TrendingUp}  color="#a78bfa" />
          <BarIndicator label="Humidity" value={data.humidity}  max={100}  unit="%"   icon={Cloud}       color="#64ffda" />
          <BarIndicator label="Wind"     value={data.wind}      max={60}   unit="kh"  icon={Wind}        color="#00f0ff" />
        </div>
      </div>
    </div>
  );
};

/* ── Main Page ─────────────────────────────────────────────────── */
export default function Cities() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();


  const runPrediction = useCallback(async (cityName: string) => {
    if (!cityName.trim()) return;
    setLoading(true);
    setSearched(false);
    setResults([]);
    setErrorMsg('');

    try {
      const response = await fetch('/api/similarity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city: cityName }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from ML API');
      }

      const data = await response.json();
      
      if (data.error) {
        // Fallback gracefully (for aesthetic demonstration on invalid)
        setResults([]);
        setErrorMsg(`API returned error: ${data.message || data.error}`);
      } else {
        // Format to match required state expectations
        const formattedResults = data.results.map((c: any) => ({
           city: c.city,
           country: c.country,
           sim: c.sim,
           temp: c.temp,
           pressure: c.pressure,
           humidity: c.humidity,
           wind: c.wind
        }));
        setResults(formattedResults);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Network/Fetch error: ${err.message || 'Unknown error'}`);
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  useEffect(() => {
    if (location.state?.autoStart) {
      // Use London as Mumbai is not in GlobalWeatherRepository.csv
      const defaultCity = location.state?.city === 'Mumbai' ? 'London' : (location.state?.city || 'London');
      setQuery(defaultCity);
      runPrediction(defaultCity);
    }
  }, [location.state, runPrediction]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') runPrediction(query);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden pt-10" style={{ fontFamily: "'Inter', sans-serif" }}>
      <CityBackground />

      {/* Page content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 flex flex-col items-center">

        {/* Navigation */}
        <Link to="/enthusiasts" className="absolute top-0 left-6 flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-white/60 hover:text-white hover:border-violet-400/50 hover:bg-violet-400/5 transition-all group">
           <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
           <span className="text-xs font-display tracking-widest uppercase">Back to Enthusiasts</span>
        </Link>

        {/* ── Header ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full"
               style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)' }}>
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" style={{ boxShadow: '0 0 6px #a78bfa' }} />
            <span className="text-violet-400/80 text-xs font-display tracking-widest uppercase">AI Climate Intelligence</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-display font-black tracking-widest text-transparent bg-clip-text mb-4 leading-tight"
              style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #00f0ff 50%, #64ffda 100%)' }}>
            Cities Like Mine
          </h1>
          <p className="text-white/45 text-base font-sans tracking-wide max-w-xl mx-auto leading-relaxed">
            Discover cities around the world that share similar climate characteristics.
          </p>
        </div>

        {/* ── Search Bar ── */}
        <div className="w-full max-w-2xl mb-10 relative">
          <div className="relative rounded-2xl overflow-hidden transition-all duration-500"
               style={{
                 background: focused ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.04)',
                 border: `1px solid ${focused ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.1)'}`,
                 boxShadow: focused ? '0 0 30px rgba(167,139,250,0.25), 0 20px 50px rgba(0,0,0,0.5)' : '0 15px 40px rgba(0,0,0,0.4)',
                 backdropFilter: 'blur(20px)',
               }}>
            
            <div className="flex items-center px-5 py-4 gap-4">
              <Search size={20} className="shrink-0" style={{ color: focused ? '#a78bfa' : 'rgba(255,255,255,0.3)', transition: 'color 0.3s' }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Enter a city name (e.g., Mumbai, Tokyo, Nairobi)"
                className="flex-1 bg-transparent outline-none text-white/90 placeholder-white/25 font-sans text-base"
              />
              {/* Search/Loading button */}
              <button
                onClick={() => runPrediction(query)}
                disabled={loading}
                className="shrink-0 flex items-center gap-2 px-5 py-2 rounded-xl font-display text-sm tracking-widest uppercase transition-all duration-300"
                style={{
                  background: loading ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.2)',
                  border: '1px solid rgba(167,139,250,0.5)',
                  color: '#a78bfa',
                  boxShadow: loading ? 'none' : '0 0 15px rgba(167,139,250,0.3)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                {loading ? 'Analyzing' : 'Predict'}
              </button>
            </div>
          </div>
        </div>

        {/* ── ML Processing Visualization ── */}
        <div className="w-full max-w-2xl">
          <MLProcessingViz active={loading} />
        </div>

        {/* ── Results ── */}
        {searched && !loading && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-6 px-1">
              <div>
                <h2 className="text-lg font-display font-bold tracking-widest text-white/80">
                  Climate Twins — <span style={{ color: '#a78bfa' }}>{query || 'Global'}</span>
                </h2>
                {errorMsg ? (
                  <p className="text-xs text-red-400 font-display tracking-wider mt-0.5">
                    {errorMsg}
                  </p>
                ) : (
                  <p className="text-xs text-white/35 font-display tracking-wider mt-0.5">
                    {results.length} similar cities found via ML similarity analysis
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-display text-emerald-400/70 tracking-widest uppercase">Model Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {results.map((r, i) => (
                <CityCard key={r.city} data={r} index={i} isBest={i === 0} />
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-10 flex-wrap">
              {[
                { range: '90–100%', color: '#00ff88', label: 'Very Similar' },
                { range: '70–89%',  color: '#aaee00', label: 'High' },
                { range: '50–69%',  color: '#ffd700', label: 'Moderate' },
                { range: '<50%',    color: '#ffaa44', label: 'Low' },
              ].map(l => (
                <div key={l.range} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
                  <span className="text-xs font-display text-white/40">
                    <span style={{ color: l.color }}>{l.range}</span> {l.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!searched && !loading && (
          <div className="text-center mt-8 opacity-50">
            <div className="text-6xl mb-4">🌍</div>
            <p className="font-display text-sm text-white/30 tracking-widest uppercase">Enter a city to discover its climate twins</p>
          </div>
        )}

      </div>
      
      <style>{`
        @keyframes windowBlink {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes skylineScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes cityParticleFloat {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-40px) scale(1.2); }
        }
        @keyframes bgRotate {
          from { transform: rotate(0deg) scale(2); }
          to { transform: rotate(360deg) scale(2); }
        }
        @keyframes nodePulse {
          0% { r: 16; stroke-opacity: 0.3; }
          100% { r: 22; stroke-opacity: 0.1; }
        }
        @keyframes edgePulse {
          0% { stroke-opacity: 0.1; }
          100% { stroke-opacity: 0.4; }
        }
        @keyframes clusterRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cityCardFadeIn {
          from { opacity: 0; transform: perspective(800px) translateY(30px) rotateX(-5deg); }
          to { opacity: 1; transform: perspective(800px) translateY(0) rotateX(0deg); }
        }
        @keyframes bestPulse {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
