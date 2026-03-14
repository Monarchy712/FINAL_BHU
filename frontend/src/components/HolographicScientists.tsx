import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Layers, Cpu, CloudRain } from 'lucide-react';

interface Props {
  className?: string;
  isExpanded?: boolean;
}

const HolographicScientists: React.FC<Props> = ({ className = '', isExpanded = false }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Floating Holographic Main Display */}
      <motion.div 
        layoutId="holo-display-main"
        className={`absolute bg-cyan-900/40 p-3 rounded-lg border border-cyan-400/50 shadow-[0_0_15px_rgba(0,255,255,0.4)] flex flex-col gap-2
          ${isExpanded ? 'w-64 h-48 -top-32 left-10' : 'w-24 h-20 -top-8 left-0'}
        `}
      >
        <motion.div 
          animate={{ scaleY: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="w-full flex-1 bg-gradient-to-t from-cyan-400/20 to-transparent border-b border-cyan-400"
        />
        <BarChart2 className={`text-cyan-300 ${isExpanded ? 'w-8 h-8' : 'w-4 h-4'}`} />
      </motion.div>

      {/* Floating Secondary Display */}
      <motion.div 
        layoutId="holo-display-sec"
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute bg-teal-900/40 rounded-lg border border-teal-400/50 shadow-[0_0_10px_rgba(0,255,180,0.3)] flex items-center justify-center
          ${isExpanded ? 'w-40 h-32 top-10 right-10' : 'w-16 h-12 top-4 right-0'}
        `}
      >
        <Layers className={`text-teal-300 ${isExpanded ? 'w-10 h-10' : 'w-5 h-5'}`} />
        <motion.div 
          animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 border border-teal-400/30 rounded-lg border-dashed"
        />
      </motion.div>

      {/* Extra floating nodes (Only visible when expanded or just subtle) */}
      {isExpanded && (
        <>
          <motion.div 
            animate={{ x: [0, -10, 0], opacity: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity }}
            className="absolute -left-10 top-0 p-2 bg-blue-900/50 rounded-full border border-blue-400/50"
          >
            <CloudRain className="w-6 h-6 text-blue-300" />
          </motion.div>
          <motion.div 
            animate={{ x: [0, 10, 0], opacity: [0, 1, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
            className="absolute -right-10 bottom-10 p-2 bg-indigo-900/50 rounded-full border border-indigo-400/50"
          >
            <Cpu className="w-6 h-6 text-indigo-300" />
          </motion.div>
        </>
      )}

      {/* Scientists Container */}
      <motion.div layoutId="scientists-svg" className={`relative flex items-end justify-center ${isExpanded ? 'w-64 h-80' : 'w-32 h-36'}`}>
        
        {/* Scientist 1 (Left - Interacting with main panel) */}
        <div className="absolute left-0 bottom-0 w-1/2 h-full">
          <svg viewBox="0 0 100 150" className="w-full h-full fill-white/90 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
            {/* Head */}
            <circle cx="45" cy="30" r="15" />
            {/* Body (Lab Coat) */}
            <path d="M45 50 M25 50 Q10 100 5 150 L85 150 Q80 100 65 50 Z" />
            {/* Arm interacting */}
            <motion.path 
              animate={isExpanded ? { d: ["M 60 70 Q 100 50 120 20", "M 60 70 Q 100 40 115 15", "M 60 70 Q 100 50 120 20"] } : { d: ["M 55 60 Q 80 50 90 30", "M 55 60 Q 80 40 85 25", "M 55 60 Q 80 50 90 30"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              stroke="white" strokeWidth="8" strokeOpacity="0.9" fill="none" strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Scientist 2 (Right - Analyzing secondary panel/tablet) */}
        <div className="absolute right-0 bottom-0 w-[45%] h-[90%] opacity-80">
          <svg viewBox="0 0 100 150" className="w-full h-full fill-white/80 filter drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]">
            {/* Head tilted slightly */}
            <circle cx="55" cy="35" r="14" />
            {/* Body */}
            <path d="M55 55 M35 55 Q20 100 15 150 L95 150 Q90 100 75 55 Z" />
            {/* Tablet/Pad being held */}
            <rect x="25" y="80" width="30" height="20" rx="2" fill="none" stroke="#00F0FF" strokeWidth="2" transform="rotate(-15 40 90)" />
            {/* Glowing line on tablet */}
            <motion.line 
              x1="30" y1="85" x2="50" y2="85"
              stroke="#00FF88" strokeWidth="1"
              transform="rotate(-15 40 90)"
              animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
            />
          </svg>
        </div>

      </motion.div>
    </div>
  );
};

export default HolographicScientists;
