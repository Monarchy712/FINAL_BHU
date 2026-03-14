import React from 'react';
import { motion } from 'framer-motion';

const Hero: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center z-10 relative pt-20 pb-12 w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="relative"
      >
        {/* Animated Glow behind text */}
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 bg-accent-cyan/20 blur-[60px] rounded-full -z-10"
        ></motion.div>

        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-br from-blue-900 via-blue-700 to-teal-600 dark:from-white dark:via-cyan-200 dark:to-teal-500 drop-shadow-[0_0_10px_rgba(0,119,212,0.4)] dark:drop-shadow-[0_0_15px_rgba(0,255,255,0.3)] select-none">
          PyClimaExplorer
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
      >
        <p className="text-xl md:text-2xl font-light text-gray-700 dark:text-gray-300 max-w-2xl px-4 leading-relaxed">
          Explore Earth's climate through interactive data visualization
        </p>
      </motion.div>
    </div>
  );
};

export default Hero;
