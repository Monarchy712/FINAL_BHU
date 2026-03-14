import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe2, Thermometer, Droplets } from 'lucide-react';
import HolographicEarth from './HolographicEarth';

interface Props {
  onClose: () => void;
  layoutId: string;
}

const EnthusiastsDashboard: React.FC<Props> = ({ onClose, layoutId }) => {
  return (
    <motion.div
      layoutId={layoutId}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-slate-900/60"
    >
      {/* Dynamic Aurora Tint */}
      <div className="absolute inset-0 opacity-20 mix-blend-screen pointer-events-none">
        <motion.div 
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-tr from-green-500/10 via-blue-500/10 to-purple-500/10 blur-3xl scale-150"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white backdrop-blur-md transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Return Home</span>
        </button>
        <div className="flex items-center gap-2 text-green-300 font-medium px-4 py-1 rounded-full bg-green-900/30 border border-green-500/30 backdrop-blur-md">
          <Globe2 className="w-5 h-5" />
          Live Earth View
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center p-6 gap-8">
        
        {/* Exploration Globe Area */}
        <div className="flex-1 flex justify-center items-center relative min-h-[400px]">
          {/* Expanded Hologram Graphic linking from ActionCards Hover */}
          <HolographicEarth isExpanded={true} className="scale-125 md:scale-150 pointer-events-none" />
        </div>

        {/* Interactive Story Panels */}
        <div className="w-full md:w-[400px] space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
          >
            <h3 className="text-xl font-medium text-white mb-2">Global Warming Signs</h3>
            <p className="text-blue-100/70 text-sm leading-relaxed mb-4">
              Witness the visual changes across polar regions and temperature variations over the last decade.
            </p>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded bg-red-500/20 text-red-300 text-xs border border-red-500/30">Heat Anomalies</span>
              <span className="px-3 py-1 rounded bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">Ice Melt</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md grid grid-cols-2 gap-4"
          >
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-900/30">
              <Thermometer className="w-6 h-6 text-orange-400 mb-2" />
              <span className="text-xs text-white/60">Avg Temp</span>
              <span className="text-lg text-white font-medium">+1.2°C</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-900/30">
              <Droplets className="w-6 h-6 text-blue-400 mb-2" />
              <span className="text-xs text-white/60">Sea Level</span>
              <span className="text-lg text-white font-medium">+3.4mm</span>
            </div>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
};

export default EnthusiastsDashboard;
