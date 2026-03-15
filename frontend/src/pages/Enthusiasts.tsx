import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Map, Building2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ─── PARTICLES BACKGROUND ─────────────────────────────────── */
interface ParticleProps {
  color1: string;
  color2: string;
}

const ParticleCanvas: React.FC<ParticleProps> = ({ color1, color2 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf: number;
    const particles: any[] = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize); resize();
    for (let i = 0; i < 80; i++) particles.push({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4, vy: -Math.random() * 0.5 - 0.1,
      r: Math.random() * 2, a: Math.random() * 0.4 + 0.1,
      c: Math.random() > 0.5 ? color1 : color2
    });
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < 0) p.y = canvas.height;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        ctx.fillStyle = `rgba(${p.c},${p.a})`; ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      raf = requestAnimationFrame(render);
    };
    render();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [color1, color2]);
  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
};

/* ─── STORY MODE CARD ────────────────────────────────────────── */
interface CardProps {
    onHover: (id: string | null) => void;
    active: boolean;
}

interface StoryCardProps extends CardProps {
    onClick: () => void;
}

const StoryCard: React.FC<StoryCardProps> = ({ onHover, active, onClick }) => (
  <div
    className={`user-card user-card-story group ${active ? 'user-card-active' : ''}`}
    onMouseEnter={() => onHover('story')}
    onMouseLeave={() => onHover(null)}
    onClick={onClick}
    style={{ transform: 'rotate(-5deg) translateY(10px)', cursor: 'pointer' }}
  >
    {/* Popout: 3D book with emerging elements */}
    <div className="story-popout-wrap">
      {/* Book */}
      <div className="story-book">
        <div className="book-cover book-left">
          <div className="book-lines"><span/><span/><span/></div>
        </div>
        <div className="book-cover book-right">
          <div className="book-lines"><span/><span/><span/></div>
        </div>
        {/* Elements emerging from book */}
        <div className="book-cloud cloud-1">☁</div>
        <div className="book-cloud cloud-2">🌧</div>
        <div className="book-cloud cloud-3">🌿</div>
        <div className="book-cloud cloud-4">🌊</div>
        {/* Magic particles */}
        {[...Array(10)].map((_, i) => (
          <div key={i} className="magic-particle" style={{
            left: `${10 + (i * 8)}%`, animationDelay: `${i * 0.12}s`, animationDuration: `${1.5 + (i * 0.1)}s`
          } as React.CSSProperties} />
        ))}
      </div>
    </div>

    {/* Card content */}
    <div className="user-card-inner">
      <div className="user-card-icon text-emerald-400 drop-shadow-[0_0_12px_#34d399]">
        <BookOpen size={52} />
      </div>
      <h2 className="user-card-title text-emerald-400">Story<br/>Mode</h2>
      <p className="user-card-sub">Journey through climate stories</p>
    </div>

    {/* Neon edge */}
    <div className="user-card-glow" style={{ '--glow-color': 'rgba(52,211,153,0.5)', '--glow-hard': '#34d399' } as React.CSSProperties} />
  </div>
);

/* ─── GUIDED TOUR CARD ────────────────────────────────────────── */
interface TourCardProps extends CardProps {
    onClick: () => void;
}
const TourCard: React.FC<TourCardProps> = ({ onHover, active, onClick }) => (
  <div
    className={`user-card user-card-tour group ${active ? 'user-card-active' : ''}`}
    onMouseEnter={() => onHover('tour')}
    onMouseLeave={() => onHover(null)}
    onClick={onClick}
    style={{ transform: 'rotate(0deg) translateY(-5px)', zIndex: 20, cursor: 'pointer' }}
  >
    {/* Popout: Folding map with compass */}
    <div className="tour-popout-wrap">
      <div className="tour-map">
        <div className="map-panel map-top">
          <div className="map-grid" />
          <div className="map-route route-1" />
          <div className="map-route route-2" />
          <div className="map-pin pin-1">📍</div>
          <div className="map-pin pin-2">📍</div>
        </div>
        <div className="map-panel map-bottom">
          <div className="map-grid" />
          <div className="map-route route-3" />
        </div>
        {/* Compass */}
        <div className="tour-compass">
          <div className="compass-ring">
            <div className="compass-needle" />
            <span className="compass-n">N</span>
          </div>
        </div>
        {/* Guide character */}
        <div className="tour-guide">🧭</div>
      </div>
    </div>

    <div className="user-card-inner">
      <div className="user-card-icon text-sky-400 drop-shadow-[0_0_12px_#38bdf8]">
        <Map size={52} />
      </div>
      <h2 className="user-card-title text-sky-400">Guided<br/>Tour</h2>
      <p className="user-card-sub">Explore climate zones interactively</p>
    </div>

    <div className="user-card-glow" style={{ '--glow-color': 'rgba(56,189,248,0.5)', '--glow-hard': '#38bdf8' } as React.CSSProperties} />
  </div>
);

/* ─── CITIES LIKE MINE CARD ────────────────────────────────────── */
interface CityCardProps extends CardProps {
    onClick: () => void;
}
const CityCard: React.FC<CityCardProps> = ({ onHover, active, onClick }) => (
  <div
    className={`user-card user-card-city group ${active ? 'user-card-active' : ''}`}
    onMouseEnter={() => onHover('city')}
    onMouseLeave={() => onHover(null)}
    onClick={onClick}
    style={{ transform: 'rotate(5deg) translateY(10px)', cursor: 'pointer' }}
  >
    {/* Popout: Mini city skyline */}
    <div className="city-popout-wrap">
      <div className="city-skyline">
        <div className="building b1" /><div className="building b2" /><div className="building b3" />
        <div className="building b4" /><div className="building b5" /><div className="building b6" />
        {/* Roads */}
        <div className="city-road" />
        {/* Rain + wind particles */}
        {[...Array(12)].map((_, i) => (
          <div key={i} className="rain-drop" style={{
            left: `${5 + (i * 8)}%`, animationDelay: `${i * 0.08}s`, animationDuration: `${0.8 + (Math.random() * 0.4)}s`
          } as React.CSSProperties} />
        ))}
        {/* Climate data icons */}
        <div className="climate-icon ci-temp">🌡 +2.4°</div>
        <div className="climate-icon ci-wind">💨 32km/h</div>
        <div className="climate-icon ci-rain">🌧 87%</div>
        {/* Glow overlays */}
        <div className="city-glow-overlay" />
      </div>
    </div>

    <div className="user-card-inner">
      <div className="user-card-icon text-violet-400 drop-shadow-[0_0_12px_#a78bfa]">
        <Building2 size={52} />
      </div>
      <h2 className="user-card-title text-violet-400">Cities<br/>Like Mine</h2>
      <p className="user-card-sub">Discover urban climate patterns</p>
    </div>

    <div className="user-card-glow" style={{ '--glow-color': 'rgba(167,139,250,0.5)', '--glow-hard': '#a78bfa' } as React.CSSProperties} />
  </div>
);

/* ─── AMBIENT BACKGROUNDS ────────────────────────────────────── */
interface AmbientProps {
    visible: boolean;
}

const AmbientStory: React.FC<AmbientProps> = ({ visible }) => (
  <div className={`user-ambient transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}>
    {/* Watercolor clouds */}
    <div className="amb-cloud ac1" />
    <div className="amb-cloud ac2" />
    <div className="amb-cloud ac3" />
    {/* Wind streaks */}
    {[...Array(8)].map((_, i) => (
      <div key={i} className="amb-wind" style={{ top: `${10 + (i * 11)}%`, animationDelay: `${i * 0.3}s`, animationDuration: `${4 + (i * 0.5)}s` } as React.CSSProperties} />
    ))}
    <div className="user-ambient-bg" style={{ background: 'radial-gradient(ellipse at bottom, rgba(16,52,40,0.8) 0%, rgba(5,15,10,0.9) 100%)' }} />
  </div>
);

const AmbientTour: React.FC<AmbientProps> = ({ visible }) => (
  <div className={`user-ambient transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}>
    {/* Map grid overlay */}
    <div className="amb-map-grid" />
    {/* Rotating compass */}
    <div className="amb-compass">🧭</div>
    {/* Glowing route lines */}
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="none">
      <path d="M100 900 Q400 500 800 600 T1500 200" stroke="rgba(56,189,248,0.4)" strokeWidth="4" fill="none" strokeDasharray="20 10" className="amb-route" />
      <path d="M200 200 Q900 400 1600 700" stroke="rgba(56,189,248,0.25)" strokeWidth="3" fill="none" strokeDasharray="15 15" className="amb-route" style={{animationDelay:'1s'}}/>
    </svg>
    {/* Highlighted regions */}
    <div className="amb-region reg-1" />
    <div className="amb-region reg-2" />
    <div className="user-ambient-bg" style={{ background: 'radial-gradient(ellipse at bottom, rgba(12,30,52,0.8) 0%, rgba(3,8,18,0.9) 100%)' }} />
  </div>
);

const AmbientCity: React.FC<AmbientProps> = ({ visible }) => (
  <div className={`user-ambient transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}>
    {/* Background skyline silhouette */}
    <div className="amb-skyline" />
    {/* Traffic lights / glow */}
    {[...Array(10)].map((_, i) => (
      <div key={i} className="amb-light" style={{
        left: `${5 + (i * 10)}%`, bottom: `${20 + ((i % 4) * 8)}%`,
        animationDelay: `${i * 0.2}s`, background: `hsl(${260 + (i * 10)},80%,65%)`
      } as React.CSSProperties} />
    ))}
    {/* Rain overlay */}
    <div className="amb-rain-overlay" />
    {/* Climate overlay gradients */}
    <div className="amb-heat-overlay" />
    <div className="user-ambient-bg" style={{ background: 'radial-gradient(ellipse at bottom, rgba(30,15,50,0.8) 0%, rgba(5,3,12,0.9) 100%)' }} />
  </div>
);

/* ─── MAIN PAGE ────────────────────────────────────────────────── */
export default function Enthusiasts() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const particleColors: Record<string, { c1: string, c2: string }> = {
    story:  { c1: '52,211,153', c2: '16,185,129' },
    tour:   { c1: '56,189,248', c2: '14,165,233' },
    city:   { c1: '167,139,250', c2: '139,92,246' },
    default:{ c1: '0,240,255',  c2: '100,255,218' },
  };
  const pc = hovered ? particleColors[hovered] : particleColors.default;

  return (
    <div className="user-page">
      {/* Fixed dark bg */}
      <div className="atmospheric-particles" />
      <div className="world-grid-bg" />
      <ParticleCanvas key={hovered} color1={pc.c1} color2={pc.c2} />

      {/* Ambient backgrounds */}
      <AmbientStory visible={hovered === 'story'} />
      <AmbientTour  visible={hovered === 'tour'} />
      <AmbientCity  visible={hovered === 'city'} />

      {/* Header */}
      <header className="relative z-10 text-center mb-6">
        <h1 className="text-5xl font-black font-display tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400 drop-shadow-[0_0_20px_rgba(100,200,255,0.4)] mb-3">
          EXPLORE
        </h1>
        <p className="text-white/40 text-sm tracking-widest font-display">Choose your climate learning experience</p>
      </header>

      {/* Diagonal card tray */}
      <div className="user-card-tray">
        <StoryCard onHover={setHovered} active={hovered === 'story'} onClick={() => navigate('/enthusiasts/story')} />
        <TourCard  onHover={setHovered} active={hovered === 'tour'} onClick={() => navigate('/enthusiasts/guided_tour')} />
        <CityCard  onHover={setHovered} active={hovered === 'city'} onClick={() => navigate('/cities')} />
      </div>

      <button 
        onClick={() => window.location.href = '/'}
        className="fixed bottom-8 left-8 z-50 flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-white/60 hover:text-white transition-all backdrop-blur-md group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-display tracking-widest uppercase">Back to Hub</span>
      </button>
    </div>
  );
}
