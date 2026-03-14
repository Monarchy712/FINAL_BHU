import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity, Database, BarChart2, Cpu } from 'lucide-react';
import HolographicScientists from './HolographicScientists';

interface Props {
  onClose: () => void;
  layoutId: string;
}

const ResearchersDashboard: React.FC<Props> = ({ onClose, layoutId }) => {
  return (
    <motion.div
      layoutId={layoutId}
      className="fixed inset-0 z-[100] flex flex-col bg-gray-900 text-cyan-50 overflow-hidden"
    >
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMTBoNDBNMCAyMGg0ME0wIDMwaDQwTTEwIDB2NDBNMjAgMHY0ME0zMCAwdjQwIiBzdHJva2U9InJnYmEoMCwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] pointer-events-none"></div>
      
      {/* Animated scanline */}
      <motion.div 
        animate={{ y: ['-100%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 h-[20%] bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent pointer-events-none"
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 border-b border-cyan-800/30 bg-gray-900/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-cyan-900/40 transition-colors text-cyan-400"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 text-cyan-400">
            <Activity className="w-6 h-6" />
            <h2 className="text-xl font-bold tracking-wider">RESEARCH LAB</h2>
          </div>
        </div>
        <div className="flex gap-4 opacity-70">
          <div className="flex items-center gap-2 text-sm"><Database className="w-4 h-4"/> SYNCED</div>
          <div className="flex items-center gap-2 text-sm"><Cpu className="w-4 h-4"/> ONLINE</div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Main Chart Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
          className="md:col-span-2 bg-gray-800/50 border border-cyan-800/30 rounded-xl p-6 flex flex-col backdrop-blur-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
              <BarChart2 className="w-5 h-5"/> Global Temperature Variance
            </h3>
            <span className="text-xs text-cyan-500 font-mono tracking-widest bg-cyan-950/50 px-3 py-1 rounded">LIVE FEED</span>
          </div>
          <div className="flex-1 relative border border-cyan-900/40 rounded-lg overflow-hidden bg-gray-900/50 flex items-end justify-center">
            {/* Expanded Hologram Graphic linking from ActionCards Hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-40 mix-blend-screen overflow-visible pointer-events-none">
              <HolographicScientists isExpanded={true} className="mt-20 scale-125" />
            </div>

            {/* Mock Chart Visualization overlayed */}
            <div className="w-full h-full flex items-end px-4 gap-2 opacity-80 pt-10 z-10">
              {[...Array(20)].map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${20 + Math.random() * 80}%` }}
                  transition={{ duration: 1.5, delay: 0.4 + (i * 0.05) }}
                  className="flex-1 bg-gradient-to-t from-cyan-900 to-cyan-400 rounded-t-sm mix-blend-screen shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Side Panel */}
        <div className="space-y-6 flex flex-col">
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className="bg-gray-800/50 border border-cyan-800/30 rounded-xl p-6 backdrop-blur-sm"
          >
            <h3 className="text-sm font-semibold text-cyan-300 mb-4 opacity-70 uppercase tracking-widest">Active Models</h3>
            <div className="space-y-4">
              {['Atmospheric Flow', 'Oceanic Currents', 'Carbon Distribution'].map((model, i) => (
                <div key={i} className="flex justify-between items-center border-b border-cyan-900/30 pb-2">
                  <span className="text-sm">{model}</span>
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_#22d3ee]"></div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            className="bg-cyan-900/20 border border-cyan-500/30 flex-1 rounded-xl p-6 backdrop-blur-sm flex items-center justify-center flex-col text-center"
          >
            <div className="w-16 h-16 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mb-4"></div>
            <p className="text-cyan-400 font-mono text-sm max-w-xs leading-relaxed">Cross-referencing satellite imagery against deep atmospheric AI models...</p>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
};

export default ResearchersDashboard;
