import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe2, 
  AlertTriangle, 
  Map, 
  Cpu,
  ArrowLeft,
  Mountain
} from 'lucide-react';


const EnvironmentBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
  
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let requestID: number;
        let particles: ParticleImpl[] = [];
  
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();
  
        class ParticleImpl {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            alpha: number;
            color: string;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5 - 0.15; // float mostly up
                this.size = Math.random() * 2.5;
                this.alpha = Math.random() * 0.5 + 0.1;
                this.color = Math.random() > 0.5 ? '0, 240, 255' : '100, 255, 218';
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0) this.x = canvas!.width;
                if (this.x > canvas!.width) this.x = 0;
                if (this.y < 0) this.y = canvas!.height;
                if (this.y > canvas!.height) this.y = 0;
            }
            draw() {
                ctx!.fillStyle = `rgba(${this.color}, ${this.alpha})`;
                ctx!.beginPath();
                ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx!.fill();
            }
        }
  
        for (let i = 0; i < 60; i++) {
            particles.push(new ParticleImpl());
        }
  
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestID = window.requestAnimationFrame(render);
        };
        render();
  
        return () => {
            window.removeEventListener('resize', resize);
            window.cancelAnimationFrame(requestID);
        };
    }, []);
  
    return (
        <>
            <div className="atmospheric-particles"></div>
            <div className="world-grid-bg"></div>
            <canvas ref={canvasRef} className="fixed inset-0 w-full h-full opacity-60 z-[-1] pointer-events-none" />
        </>
    );
};

export default function Researchers() {
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden relative transition-colors duration-1000"
         style={{
            backgroundColor: 
              activeHover === 'spatial' ? 'rgba(0, 240, 255, 0.05)' :
              activeHover === 'anomaly' ? 'rgba(255, 51, 51, 0.08)' :
              activeHover === 'intensity' ? 'rgba(255, 107, 0, 0.05)' :
              activeHover === 'forecast' ? 'rgba(100, 255, 218, 0.05)' : 
              activeHover === 'landscape' ? 'rgba(156, 39, 176, 0.06)' : 
              'transparent'
         }}
    >
      <EnvironmentBackground />

      {/* Dynamic Background Overlays Based on Hover */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000 mix-blend-screen opacity-0 overflow-hidden flex items-center justify-center transform scale-150 origin-center"
        style={{ 
          opacity: activeHover === 'spatial' ? 0.6 : 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.2) 0%, transparent 80%)'
        }}
      >
          <div className="absolute w-[250vw] h-[150vh] globe-texture animate-globe-spin opacity-50 [mask-image:radial-gradient(black,transparent_70%)]"></div>
          <div className="w-[150vw] md:w-[100vw] aspect-square rounded-full border-[2px] border-portal-teal/30 p-20 animate-spin-slow opacity-80">
              <div className="w-full h-full rounded-full border-[3px] border-dashed border-portal-teal/40 animate-[clockSpin_60s_linear_infinite]"></div>
          </div>
      </div>

      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000 mix-blend-screen opacity-0 overflow-hidden transform scale-150 origin-bottom"
        style={{ 
          opacity: activeHover === 'anomaly' ? 0.8 : 0,
          background: 'radial-gradient(circle at center bottom, rgba(255, 51, 51, 0.3) 0%, transparent 80%)'
        }}
      >
          <svg viewBox="0 0 1000 1000" className="absolute inset-0 w-full h-full opacity-80 drop-shadow-[0_0_30px_#ff3333]">
              <path d="M 500 1000 L 450 750 L 600 600 L 350 400 L 550 200 L 400 50 L 500 0" 
                    stroke="#ff3333" strokeWidth="12" fill="none" className="crack-burst" />
              <path d="M 600 600 L 800 700 L 700 450 L 950 300" 
                    stroke="#ff6b00" strokeWidth="10" fill="none" className="crack-burst" style={{transitionDelay: '0.4s'}}/>
              <path d="M 450 750 L 200 800 L 300 550 L 50 450" 
                    stroke="#ff6b00" strokeWidth="8" fill="none" className="crack-burst" style={{transitionDelay: '0.5s'}}/>
          </svg>
      </div>

      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000 mix-blend-screen opacity-0 overflow-hidden transform scale-150 origin-center"
        style={{ 
          opacity: activeHover === 'intensity' ? 0.8 : 0,
          background: 'radial-gradient(circle at center, rgba(34, 197, 94, 0.05) 0%, transparent 60%)'
        }}
      >
          {/* Base Heat Signatures */}
          <div className="absolute top-[10%] left-[10%] w-[80vw] h-[80vw] bg-green-500 rounded-full blur-[150px] animate-heat-blob-move mix-blend-screen opacity-30" style={{animationDuration: '10s'}}></div>
          <div className="absolute top-[30%] right-[30%] w-[100vw] h-[100vw] bg-yellow-400 rounded-full blur-[180px] animate-heat-blob-move mix-blend-screen opacity-40" style={{animationDuration: '8s', animationDelay: '2s'}}></div>
          <div className="absolute bottom-[10%] right-[10%] w-[120vw] h-[120vw] bg-red-500 rounded-full blur-[200px] animate-heat-blob-move mix-blend-screen opacity-50" style={{animationDuration: '6s', animationDelay: '4s'}}></div>
          
          {/* Radar Sweep Scanner */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] rounded-full opacity-40" 
               style={{
                 background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(255, 107, 0, 0.1) 320deg, rgba(255, 51, 51, 0.4) 360deg)',
                 animation: 'clockSpin 8s linear infinite'
               }}>
          </div>

          {/* Wobbling Topographical/Isobar Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-40 mix-blend-screen pointer-events-none">
              <div className="absolute w-[30vw] h-[30vw] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] border-2 border-red-500 animate-[heatBlobMove_8s_linear_infinite_alternate] drop-shadow-[0_0_8px_#ff3333]"></div>
              <div className="absolute w-[50vw] h-[50vw] rounded-[50%_40%_30%_60%/60%_40%_50%_40%] border-[1.5px] border-orange-500 animate-[heatBlobMove_12s_linear_infinite_alternate-reverse]"></div>
              <div className="absolute w-[70vw] h-[70vw] rounded-[60%_30%_50%_40%/50%_60%_40%_50%] border border-yellow-500 animate-[heatBlobMove_16s_linear_infinite_alternate]"></div>
              <div className="absolute w-[90vw] h-[90vw] rounded-[40%_50%_60%_50%/40%_60%_70%_30%] border border-green-500 animate-[heatBlobMove_20s_linear_infinite_alternate-reverse] opacity-50"></div>
          </div>

          {/* Scanning Coordinate Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,107,0,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,107,0,0.15)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)] animate-[pulse_4s_infinite]"></div>

          {/* Floating Data Variables - Temperature Array */}
          <div className="absolute inset-0 pointer-events-none font-display text-portal-red font-bold mix-blend-screen opacity-70">
              <div className="absolute top-[20%] left-[20%] text-5xl animate-[heatBlobMove_4s_infinite_alternate_ease-in-out] drop-shadow-[0_0_10px_#ff3333]">∆T +1.5°C</div>
              <div className="absolute top-[40%] right-[25%] text-6xl animate-[heatBlobMove_5s_infinite_alternate-reverse_ease-in-out]" style={{animationDelay: '1s'}}>+2.4°C</div>
              <div className="absolute bottom-[30%] left-[40%] text-7xl animate-[heatBlobMove_6s_infinite_alternate_ease-in-out] text-portal-orange drop-shadow-[0_0_15px_#ff6b00]" style={{animationDelay: '2s'}}>CRITICAL +3.1°C</div>
              <div className="absolute bottom-[15%] right-[15%] text-4xl animate-[heatBlobMove_3s_infinite_alternate_ease-in-out]" style={{animationDelay: '0.5s'}}>+1.8°C</div>
              <div className="absolute top-[10%] right-[40%] text-3xl animate-[heatBlobMove_7s_infinite_alternate-reverse_ease-in-out]" style={{animationDelay: '1.5s', color: '#eab308'}}>+0.9°C</div>
          </div>
      </div>

      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000 mix-blend-screen opacity-0 overflow-hidden transform scale-150 origin-top"
        style={{ 
          opacity: activeHover === 'forecast' ? 0.8 : 0,
          background: 'radial-gradient(ellipse at top center, rgba(100, 255, 218, 0.2) 0%, transparent 60%)'
        }}
      >
          <svg viewBox="0 0 1000 1000" className="absolute inset-0 w-full h-full text-portal-neon opacity-80">
              <path d="M 100 1000 Q 400 800 500 500 T 900 100" stroke="currentColor" strokeWidth="12" fill="none" className="ai-line-rise drop-shadow-[0_0_20px_#64ffda]" />
              <g className="animate-neural-flow">
                  <line x1="100" y1="1000" x2="300" y2="700" stroke="currentColor" strokeWidth="6" opacity="0.6"/>
                  <line x1="500" y1="500" x2="300" y2="700" stroke="currentColor" strokeWidth="6" opacity="0.6"/>
                  <line x1="500" y1="500" x2="700" y2="300" stroke="currentColor" strokeWidth="6" opacity="0.6"/>
                  <line x1="900" y1="100" x2="700" y2="300" stroke="currentColor" strokeWidth="6" opacity="0.6"/>
                  <circle cx="100" cy="1000" r="15" fill="currentColor" className="drop-shadow-[0_0_10px_#00f0ff]"/>
                  <circle cx="300" cy="700" r="15" fill="currentColor" className="drop-shadow-[0_0_10px_#00f0ff]"/>
                  <circle cx="500" cy="500" r="25" fill="#00f0ff" className="drop-shadow-[0_0_20px_#64ffda]"/>
                  <circle cx="700" cy="300" r="15" fill="currentColor" className="drop-shadow-[0_0_10px_#00f0ff]"/>
                  <circle cx="900" cy="100" r="25" fill="#00f0ff" className="drop-shadow-[0_0_20px_#64ffda]"/>
              </g>
          </svg>
      </div>

      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000 mix-blend-screen opacity-0 overflow-hidden flex items-center justify-center transform scale-150 origin-bottom"
        style={{ 
          opacity: activeHover === 'landscape' ? 0.7 : 0,
          background: 'linear-gradient(to top, rgba(156, 39, 176, 0.15) 0%, transparent 60%)'
        }}
      >
          {/* Wireframe Terrain Simulation SVG */}
          <div className="absolute bottom-0 w-[200vw] h-[60vh] opacity-60">
              <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="w-full h-full text-purple-400 drop-shadow-[0_0_15px_rgba(156,39,176,0.6)]">
                  <path d="M 0 300 L 0 200 Q 100 180 200 220 T 400 150 T 600 250 T 800 180 T 1000 120 L 1000 300 Z" fill="rgba(156,39,176,0.1)" stroke="currentColor" strokeWidth="2" />
                  <path d="M 0 300 L 0 230 Q 120 210 220 260 T 450 180 T 650 280 T 820 220 T 1000 160 L 1000 300 Z" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-70 animate-[pulse_4s_infinite]" />
                  <path d="M 0 300 L 0 250 Q 80 240 180 280 T 500 200 T 700 290 T 850 250 T 1000 190 L 1000 300 Z" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-40 animate-[pulse_3s_infinite_0.5s]" />
              </svg>
          </div>
          {/* Vertical Terrain Mapping Lasers */}
          <div className="absolute inset-x-0 bottom-0 h-[60vh] bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(156,39,176,0.1)_40px,rgba(156,39,176,0.1)_42px)] animate-[timeWave_15s_linear_infinite] [mask-image:linear-gradient(to_top,black,transparent)]"></div>
      </div>

      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-portal-teal/10 hover:bg-portal-teal/20 border border-portal-teal/30 rounded-full text-portal-teal backdrop-blur-md transition-all group shadow-[0_0_15px_rgba(0,240,255,0.2)]"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-display tracking-widest text-sm">RETURN TO HUB</span>
      </button>

      <header className="mb-16 text-center z-10">
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-portal-teal to-portal-neon drop-shadow-[0_0_15px_rgba(0,240,255,0.4)] mb-4">
          SYSTEM TERMINAL
        </h1>
        <p className="text-portal-teal/70 font-sans tracking-wide max-w-xl mx-auto text-sm drop-shadow-[0_0_5px_rgba(0,240,255,0.2)]">
          Initiate analysis protocol. Hover over subsystems to preview localized data models.
        </p>
      </header>

      {/* Grid Layout - 3 top, 2 bottom to accommodate 5 cards evenly */}
      <main className="flex flex-wrap justify-center gap-x-8 gap-y-24 max-w-6xl mx-auto w-full z-10 pt-16 mt-8">

        {/* 1. Geospatial Climate Explorer (Globe Pop-out) */}
        <div 
          className="group holo-card relative w-[320px] h-[400px] flex flex-col justify-center items-center text-center mx-auto cursor-pointer"
          onMouseEnter={() => setActiveHover('spatial')}
          onMouseLeave={() => setActiveHover(null)}
          onClick={() => navigate('/spatial')}
        >
          
          {/* POP-OUT ELEMENT */}
          <div className="popout-container !w-56 !h-56 !-top-20">
             <div className="w-full h-full absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full globe-sphere overflow-hidden border-2 border-portal-teal/30 shadow-[0_0_30px_rgba(0,240,255,0.2)] bg-black/40">
                <div className="w-[200%] h-[100%] globe-texture animate-globe-spin opacity-80"></div>
                {/* Nodes & Connections overlaying the globe */}
                <div className="absolute top-[40%] left-[30%] w-3 h-3 bg-portal-neon rounded-full animate-node-pulse text-portal-neon"></div>
                <div className="absolute top-[60%] left-[60%] w-3 h-3 bg-portal-teal rounded-full animate-node-pulse text-portal-teal" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute top-[30%] left-[70%] w-3 h-3 bg-portal-orange rounded-full animate-node-pulse text-portal-orange" style={{animationDelay: '1s'}}></div>
                <svg className="absolute inset-0 w-full h-full drop-shadow-[0_0_8px_#64ffda]">
                    <path d="M 60 80 Q 100 50 120 120" className="connection-arc" />
                    <path d="M 120 120 Q 140 80 150 60" className="connection-arc" style={{transitionDelay: '0.6s'}} />
                </svg>
             </div>
             {/* Hologram Base shadow below globe */}
             <div className="w-48 h-8 bg-portal-teal/30 blur-xl rounded-[100%] absolute -bottom-6 left-1/2 -translate-x-1/2"></div>
          </div>

          <div className="flex flex-col items-center justify-center z-10 w-full pointer-events-none">
            <div className="card-icon-wrapper p-4 mb-4 bg-portal-teal/10 rounded-2xl text-portal-teal transition-all duration-300 drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
              <Globe2 size={56}/>
            </div>
            <h3 className="text-3xl card-title text-portal-teal font-display font-bold tracking-wider transition-all duration-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.4)] leading-tight">Spatial<br/>View</h3>
          </div>
        </div>

        {/* 2. Extreme Event Detector (Rupture Pop-out) */}
        <div 
          className="group holo-card relative w-[320px] h-[400px] flex flex-col justify-center items-center text-center mx-auto"
          onMouseEnter={() => setActiveHover('anomaly')}
          onMouseLeave={() => setActiveHover(null)}
        >
          
          {/* POP-OUT ELEMENT */}
          <div className="popout-container !h-80 !-top-48">
             <div className="absolute inset-0 flex items-center justify-center">
                {/* Danger Ring Expansion */}
                <div className="danger-pulse-ring !border-[4px]"></div>
                
                {/* Storm / Heat Cloud (CSS gradient blur) */}
                <div className="absolute top-10 w-64 h-48 bg-portal-red/30 blur-[40px] rounded-full mix-blend-screen opacity-0 group-hover:opacity-100 transition-opacity duration-1000 delay-300"></div>

                {/* 3D SVG Crack Bursting UP from card */}
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_20px_#ff3333] z-10">
                    <path d="M 100 200 L 90 150 L 120 120 L 70 80 L 110 40 L 80 10 L 100 0" 
                          stroke="#ff3333" strokeWidth="6" fill="none" className="crack-burst" />
                    <path d="M 120 120 L 160 140 L 140 90 L 190 60" 
                          stroke="#ff6b00" strokeWidth="5" fill="none" className="crack-burst" style={{transitionDelay: '0.4s'}}/>
                    <path d="M 90 150 L 40 160 L 60 110 L 10 90" 
                          stroke="#ff6b00" strokeWidth="4" fill="none" className="crack-burst" style={{transitionDelay: '0.5s'}}/>
                </svg>
             </div>
          </div>

          <div className="flex flex-col items-center justify-center z-10 w-full pointer-events-none">
            <div className="card-icon-wrapper p-4 mb-4 bg-portal-red/10 rounded-2xl text-portal-red transition-all duration-300 drop-shadow-[0_0_10px_rgba(255,51,51,0.5)]">
              <AlertTriangle size={56}/>
            </div>
            <h3 className="text-3xl card-title text-portal-red font-display font-bold tracking-wider transition-all duration-300 drop-shadow-[0_0_8px_rgba(255,51,51,0.4)] leading-tight">Anomaly<br/>Tracker</h3>
          </div>
        </div>

        {/* 3. Climate Intensity Map (3D Terrain Heatmap Pop-out) */}
        <div 
          className="group holo-card relative w-[320px] h-[400px] flex flex-col justify-center items-center text-center mx-auto cursor-pointer"
          onMouseEnter={() => setActiveHover('intensity')}
          onMouseLeave={() => setActiveHover(null)}
          onClick={() => navigate('/intensity')}
        >
          
          {/* POP-OUT ELEMENT */}
          <div className="popout-container !w-80 !h-64 !-top-20">
              {/* 3D Tilted Heat Surface */}
              <div className="w-full h-full absolute bottom-8 rounded-2xl heat-surface overflow-hidden border-[3px] border-portal-orange/50 bg-black/60 backdrop-blur-md shadow-[0_0_40px_rgba(255,107,0,0.3)]">
                 {/* Internal grid to help 3D illusion */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,107,0,0.3)_2px,transparent_2px),linear-gradient(90deg,rgba(255,107,0,0.3)_2px,transparent_2px)] bg-[size:30px_30px]"></div>
                 {/* Sequential Multi-Color Heat Blobs (Green -> Yellow -> Red) */}
                 <div className="absolute top-2 right-2 w-32 h-32 bg-green-500 rounded-full blur-[25px] animate-heat-blob-move mix-blend-screen opacity-90" style={{animationDuration: '6s'}}></div>
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-yellow-400 rounded-full blur-[30px] animate-heat-blob-move mix-blend-screen opacity-100" style={{animationDuration: '5s', animationDelay: '1s'}}></div>
                 <div className="absolute bottom-4 left-4 w-40 h-40 bg-portal-red rounded-full blur-[30px] animate-heat-blob-move mix-blend-screen opacity-100" style={{animationDuration: '4s', animationDelay: '2s'}}></div>
              </div>
              
              {/* Vertical radiating beams from surface */}
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-64 h-48 bg-gradient-to-t from-red-500/30 via-yellow-500/15 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-1000 delay-300 rounded-full mix-blend-screen"></div>
          </div>

          <div className="flex flex-col items-center justify-center z-10 w-full pointer-events-none">
            <div className="card-icon-wrapper p-4 mb-4 bg-portal-orange/10 rounded-2xl text-portal-orange transition-all duration-300 drop-shadow-[0_0_10px_rgba(255,107,0,0.5)]">
              <Map size={56}/>
            </div>
            <h3 className="text-3xl card-title text-portal-orange font-display font-bold tracking-wider transition-all duration-300 drop-shadow-[0_0_8px_rgba(255,107,0,0.4)] leading-tight">Intensity<br/>Map</h3>
          </div>
        </div>

        {/* 4. AI Climate Forecast (Network Float Pop-out) */}
        <div 
          className="group holo-card relative w-[320px] h-[400px] flex flex-col justify-center items-center text-center mx-auto cursor-pointer"
          onMouseEnter={() => setActiveHover('forecast')}
          onMouseLeave={() => setActiveHover(null)}
          onClick={() => window.location.href = '/predictor.html'}
        >
          
          {/* POP-OUT ELEMENT */}
          <div className="popout-container !w-72 !h-80 !-top-48">
             {/* Upward particle stream */}
             <div className="absolute inset-0 overflow-hidden rounded-t-full opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                 <div className="w-full h-[200%] bg-[linear-gradient(0deg,transparent_0%,rgba(0,240,255,0.15)_50%,transparent_100%)] animate-[timeWave_3s_linear_infinite_reverse]"></div>
             </div>

             {/* Rising AI Neural SVG */}
             <svg viewBox="0 0 100 150" className="absolute inset-0 w-full h-full text-portal-neon">
                {/* Curving Prediction Line */}
                <path d="M 10 140 Q 40 120 50 80 T 90 20" stroke="currentColor" strokeWidth="3.5" fill="none" className="ai-line-rise drop-shadow-[0_0_12px_#64ffda]" />
                
                {/* Node Network */}
                <g className="animate-neural-flow">
                    <line x1="10" y1="140" x2="30" y2="100" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
                    <line x1="50" y1="80" x2="30" y2="100" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
                    <line x1="50" y1="80" x2="70" y2="50" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
                    <line x1="90" y1="20" x2="70" y2="50" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
                    
                    <circle cx="10" cy="140" r="3" fill="currentColor"/>
                    <circle cx="30" cy="100" r="3" fill="currentColor"/>
                    <circle cx="50" cy="80" r="4.5" fill="#00f0ff"/>
                    <circle cx="70" cy="50" r="3" fill="currentColor"/>
                    <circle cx="90" cy="20" r="5" fill="#00f0ff"/>
                </g>
             </svg>
          </div>

          <div className="flex flex-col items-center justify-center z-10 w-full pointer-events-none">
            <div className="card-icon-wrapper p-4 mb-4 bg-portal-neon/10 rounded-2xl text-portal-neon transition-all duration-300 drop-shadow-[0_0_10px_rgba(100,255,218,0.5)]">
              <Cpu size={56}/>
            </div>
            <h3 className="text-3xl card-title text-portal-neon font-display font-bold tracking-wider transition-all duration-300 drop-shadow-[0_0_8px_rgba(100,255,218,0.4)] leading-tight">Future<br/>Predictor</h3>
          </div>
        </div>

        {/* 5. Landscape Analyser (Terrain Scan Pop-out) */}
        <div 
          className="group holo-card relative w-[320px] h-[400px] flex flex-col justify-center items-center text-center mx-auto cursor-pointer"
          onMouseEnter={() => setActiveHover('landscape')}
          onMouseLeave={() => setActiveHover(null)}
          onClick={() => navigate('/landscape', { state: { mlModalMode: true } })}
        >
          {/* POP-OUT ELEMENT */}
          <div className="popout-container !w-72 !h-64 !-top-24">
             {/* 3D Wireframe Base */}
             <div className="w-full h-full absolute bottom-4 rounded-xl heat-surface overflow-hidden border-[2px] border-purple-500/40 bg-black/60 backdrop-blur-md shadow-[0_0_30px_rgba(156,39,176,0.3)]">
                 {/* Internal grid to help 3D illusion */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(156,39,176,0.3)_2px,transparent_2px),linear-gradient(90deg,rgba(156,39,176,0.3)_2px,transparent_2px)] bg-[size:25px_25px] transform perspective(500px) rotateX(60deg) scale(2) origin-bottom"></div>
                 {/* Scanning Laser Line */}
                 <div className="absolute top-0 left-0 right-0 h-1 bg-purple-400 shadow-[0_0_15px_#a855f7,0_0_30px_#a855f7] animate-[heatBlobMove_3s_linear_infinite_alternate]"></div>
                 {/* Geometric Floating Nodes representing topography points */}
                 <div className="absolute top-[30%] left-[20%] w-2 h-2 bg-purple-300 transform rotate-45 shadow-[0_0_10px_#d8b4fe] animate-pulse"></div>
                 <div className="absolute top-[60%] left-[50%] w-3 h-3 bg-purple-400 transform rotate-45 shadow-[0_0_15px_#c084fc] animate-pulse" style={{animationDelay: '0.5s'}}></div>
                 <div className="absolute top-[40%] left-[80%] w-2 h-2 bg-purple-300 transform rotate-45 shadow-[0_0_10px_#d8b4fe] animate-pulse" style={{animationDelay: '1s'}}></div>
                 <svg className="absolute inset-0 w-full h-full text-purple-500/50 drop-shadow-[0_0_5px_#a855f7]">
                      <path d="M 50 150 L 140 100 L 230 180" fill="none" stroke="currentColor" strokeWidth="2" />
                 </svg>
             </div>
             
             {/* Radiating beams */}
             <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-32 bg-gradient-to-t from-purple-500/40 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 delay-200 rounded-full mix-blend-screen"></div>
          </div>

          <div className="flex flex-col items-center justify-center z-10 w-full pointer-events-none">
            <div className="card-icon-wrapper p-4 mb-4 bg-purple-500/10 rounded-2xl text-purple-400 transition-all duration-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
              <Mountain size={56}/>
            </div>
            <h3 className="text-3xl card-title text-purple-400 font-display font-bold tracking-wider transition-all duration-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] leading-tight">Landscape<br/>Analyser</h3>
          </div>
        </div>

      </main>
    </div>
  );
}
