import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className={`relative w-16 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-500 z-50 shadow-lg ${
        isDark ? 'bg-indigo-900 border border-indigo-700' : 'bg-sky-200 border border-sky-300'
      }`}
      aria-label="Toggle Theme"
    >
      <div className="flex justify-between w-full px-1 z-10">
        <Moon size={16} className={`transition-opacity duration-300 ${isDark ? 'text-blue-200 opacity-100' : 'opacity-0'}`} />
        <Sun size={16} className={`transition-opacity duration-300 ${isDark ? 'opacity-0' : 'text-amber-500 opacity-100'}`} />
      </div>
      
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className={`absolute top-1 bottom-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
          isDark ? 'bg-white left-1' : 'bg-white right-1'
        }`}
        style={{
          left: isDark ? '4px' : 'calc(100% - 28px)'
        }}
      >
        {isDark ? (
          <Moon size={12} className="text-indigo-900" />
        ) : (
          <Sun size={12} className="text-amber-500" />
        )}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
