import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Globe2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HolographicScientists from './HolographicScientists';
import HolographicEarth from './HolographicEarth';

interface ActionCardsProps {
  onHoverChange: (type: 'researchers' | 'enthusiasts' | null) => void;
}

const ActionCards: React.FC<ActionCardsProps> = ({ onHoverChange }) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.6 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 100 } }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = -((y - centerY) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    setHoveredCard(null);
    onHoverChange(null);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col md:flex-row gap-8 w-full max-w-5xl mx-auto px-4 mt-12 z-10"
    >
      {/* Researchers Card */}
      <motion.div 
        layoutId="card-researchers"
        variants={itemVariants}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => {
          setHoveredCard(0);
          onHoverChange('researchers');
        }}
        onMouseLeave={handleMouseLeave}
        onClick={() => navigate('/researchers')}
        className="flex-1 relative group cursor-pointer transition-transform duration-300 ease-out"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/0 to-accent-teal/0 group-hover:from-accent-cyan/20 group-hover:to-accent-teal/20 rounded-2xl blur-xl transition-all duration-500"></div>
        
        {/* Animated Holographic Scientist Dashboard above card on hover */}
        <AnimatePresence>
          {hoveredCard === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: -60 }}
              exit={{ opacity: 0, y: 0 }}
              transition={{ duration: 0.4, type: 'spring' }}
              className="absolute -top-10 left-0 right-0 h-40 pointer-events-none flex items-end justify-center z-20"
            >
              <HolographicScientists isExpanded={false} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative h-full flex flex-col items-start p-8 rounded-2xl glass border border-white/20 dark:border-white/10 overflow-hidden bg-white/5 dark:bg-black/20">
          <div className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMTBoNDBNMCAyMGg0ME0wIDMwaDQwTTEwIDB2NDBNMjAgMHY0ME0zMCAwdjQwIiBzdHJva2U9InJnYmEoMCwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] transition-opacity duration-700 pointer-events-none ${hoveredCard === 0 ? 'opacity-100' : 'opacity-0'}`}>
            <motion.div 
              animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2, repeat: Infinity }} 
              className="absolute inset-0 bg-gradient-to-t from-transparent via-cyan-500/10 to-transparent background-shimmer"
            ></motion.div>
          </div>

          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/50 mb-6 group-hover:scale-110 transition-transform duration-500">
            <Activity className="w-8 h-8 text-blue-600 dark:text-cyan-400" />
          </div>
          
          <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-glow transition-all duration-300">Researchers</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">Deep climate data exploration with advanced analytical tools</p>

          <div className="mt-auto flex items-center text-sm font-semibold text-blue-600 dark:text-cyan-400 opacity-80 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
            <span>Explore Data</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>
      </motion.div>

      {/* Enthusiasts Card */}
      <motion.div 
        layoutId="card-enthusiasts"
        variants={itemVariants}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => {
          setHoveredCard(1);
          onHoverChange('enthusiasts');
        }}
        onMouseLeave={handleMouseLeave}
        onClick={() => navigate('/enthusiasts')}
        className="flex-1 relative group cursor-pointer transition-transform duration-300 ease-out"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent-aurora/0 to-green-500/0 group-hover:from-accent-aurora/20 group-hover:to-green-500/20 rounded-2xl blur-xl transition-all duration-500"></div>
        
        {/* Animated Earth Hologram above card on hover */}
        <AnimatePresence>
          {hoveredCard === 1 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: -40 }}
              exit={{ opacity: 0, scale: 0.5, y: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="absolute -top-16 left-0 right-0 h-40 pointer-events-none flex items-center justify-center z-20"
            >
              <HolographicEarth isExpanded={false} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative h-full flex flex-col items-start p-8 rounded-2xl glass border border-white/20 dark:border-white/10 overflow-hidden bg-white/5 dark:bg-black/20">
          <div className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${hoveredCard === 1 ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_20%,_rgba(0,0,0,0.8)_100%)] dark:bg-[radial-gradient(circle_at_center,_transparent_20%,_var(--tw-colors-dark-bg)_100%)] z-10"></div>
            <motion.div 
              animate={{ backgroundPosition: ['0% 0%', '100% 100%'], opacity: [0.3, 0.6, 0.3] }} 
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }} 
              className="absolute inset-0 bg-gradient-to-tr from-accent-heat-red via-accent-heat-orange to-accent-heat-yellow mix-blend-overlay dark:mix-blend-color opacity-30 blur-2xl scale-150"
            ></motion.div>
          </div>

          <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/50 mb-6 group-hover:scale-110 transition-transform duration-500">
            <Globe2 className="w-8 h-8 text-green-600 dark:text-accent-aurora" />
          </div>
          
          <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-glow transition-all duration-300">Enthusiasts</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">Discover climate insights through intuitive visual stories</p>

          <div className="mt-auto flex items-center text-sm font-semibold text-green-600 dark:text-accent-aurora opacity-80 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
            <span>Discover Stories</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ActionCards;
