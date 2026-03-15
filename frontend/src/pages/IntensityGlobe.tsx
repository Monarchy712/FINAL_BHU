import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function IntensityGlobe() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {/* Back Button Overlay */}
      <button 
        onClick={() => navigate('/researchers')}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-portal-teal/10 hover:bg-portal-teal/20 border border-portal-teal/30 rounded-full text-portal-teal backdrop-blur-md transition-all group shadow-[0_0_15px_rgba(0,240,255,0.2)]"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-display tracking-widest text-sm">RETURN</span>
      </button>

      {/* Info Overlay */}
      <div className="absolute top-24 left-10 z-40 pointer-events-none text-left">
         <h2 className="font-display text-4xl font-bold tracking-wider text-portal-orange drop-shadow-[0_0_10px_rgba(255,107,0,0.3)]">
            INTENSITY MAP
         </h2>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
           <div className="w-16 h-16 border-4 border-portal-orange/20 border-t-portal-orange rounded-full animate-spin"></div>
        </div>
      )}

      {/* Embedded Original Cesium Globe */}
      <iframe 
        src="/legacy-globe/"
        className="w-full h-full border-none relative z-20"
        onLoad={() => setLoading(false)}
        title="Cesium Intensity Globe"
      />
    </div>
  );
}
