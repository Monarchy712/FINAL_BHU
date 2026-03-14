import React from 'react';
import { motion } from 'framer-motion';
// Globe2 removed as it was unused

interface Props {
  className?: string;
  isExpanded?: boolean;
}

const HolographicEarth: React.FC<Props> = ({ className = '', isExpanded = false }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      
      {/* Container holding the Earth and effects */}
      <motion.div 
        layoutId="holo-earth-container" 
        className={`relative flex items-center justify-center ${isExpanded ? 'w-[500px] h-[500px]' : 'w-32 h-32'}`}
      >
        
        {/* Orbiting Rings */}
        <motion.div 
          animate={{ rotate: 360, rotateX: 65 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-10%] rounded-full border border-green-400/30"
          style={{ transformStyle: 'preserve-3d' }}
        />
        <motion.div 
          animate={{ rotate: -360, rotateY: 75 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-20%] rounded-full border border-cyan-400/20"
          style={{ transformStyle: 'preserve-3d' }}
        />

        {/* The Earth Globe (Mini Version) */}
        {!isExpanded && (
          <div className="relative w-full h-full rounded-full border border-green-400/40 shadow-[0_0_20px_rgba(0,255,136,0.3)] bg-slate-900/90 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.2),_transparent_70%)] z-20"></div>
            <motion.div 
               animate={{ x: ['0%', '-50%'] }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 w-[200%] h-full flex z-10 opacity-60"
            >
              <div className="w-1/2 h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/c/c3/Solarsystemscope_texture_8k_earth_daymap.jpg')] bg-cover bg-center [filter:hue-rotate(90deg)_brightness(0.7)]"></div>
              <div className="w-1/2 h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/c/c3/Solarsystemscope_texture_8k_earth_daymap.jpg')] bg-cover bg-center [filter:hue-rotate(90deg)_brightness(0.7)]"></div>
            </motion.div>
            
            {/* Heatmap pulses */}
            <motion.div 
              animate={{ opacity: [0.1, 0.6, 0.1], scale: [1, 1.2, 1] }} 
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-1/4 left-1/4 w-8 h-8 bg-red-500/40 rounded-full blur-md z-20"
            />
            
            <div className="absolute inset-0 shadow-[inset_-10px_-10px_30px_rgba(0,0,0,0.8)] z-30 pointer-events-none"></div>
          </div>
        )}

        {/* Orbiting Wind Stream Particles (Mini) */}
        {!isExpanded && (
          <motion.div 
            className="absolute inset-[-30%] z-40 pointer-events-none" 
            animate={{ rotate: 360 }} 
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]"></div>
            <div className="absolute bottom-1/4 right-0 w-1 h-1 rounded-full bg-green-300 shadow-[0_0_6px_rgba(134,239,172,0.8)]"></div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default HolographicEarth;
