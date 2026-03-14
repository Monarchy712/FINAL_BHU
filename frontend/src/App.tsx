import { useState, useEffect } from 'react';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';
import ThemeToggle from './components/ThemeToggle';
import Hero from './components/Hero';
import ActionCards from './components/ActionCards';
import BackgroundEffects from './components/BackgroundEffects';
import Researchers from './pages/Researchers';
import Enthusiasts from './pages/Enthusiasts';
import GuidedTourPage from './pages/GuidedTourPage';
import SpatialGlobe from './pages/SpatialGlobe';
import IntensityGlobe from './pages/IntensityGlobe';
import Cities from './pages/Cities';
import ClimateLandscape from './pages/ClimateLandscape';

export type ActiveMode = 'researchers' | 'enthusiasts' | null;

function App() {
  const [isDark, setIsDark] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<ActiveMode>(null);
  const location = useLocation();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className={`relative min-h-screen w-full overflow-hidden transition-colors duration-500 ${isDark ? 'bg-dark-bg text-white' : 'bg-light-bg text-gray-900'}`}>
      
      {/* Background container */}
      <BackgroundEffects 
        isDark={isDark} 
        activeMode={location.pathname === '/researchers' ? 'researchers' : location.pathname === '/enthusiasts' ? 'enthusiasts' : null} 
        isHovered={!!hoveredCard} 
      />

      {/* Top Right Header Elements */}
      <header className="absolute top-0 right-0 p-6 z-50 flex items-center justify-end w-full pointer-events-none">
        <nav className="flex items-center gap-6 pointer-events-auto">
          <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
        </nav>
      </header>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            <LayoutGroup>
              <motion.main 
                key="home"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20 mx-auto max-w-7xl"
              >
                <Hero />
                <ActionCards onHoverChange={setHoveredCard} />
              </motion.main>
            </LayoutGroup>
          } />
          <Route path="/researchers" element={
            <motion.div 
              key="researchers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-50"
            >
              <Researchers />
            </motion.div>
          } />
          <Route path="/enthusiasts" element={
            <motion.div 
              key="enthusiasts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-50"
            >
              <Enthusiasts />
            </motion.div>
          } />
          <Route path="/enthusiasts/guided_tour" element={
            <motion.div 
              key="guided-tour"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-50 w-full h-screen"
            >
              <GuidedTourPage />
            </motion.div>
          } />
          <Route path="/spatial" element={
            <motion.div 
              key="spatial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-50 w-full h-screen"
            >
              <SpatialGlobe />
            </motion.div>
          } />
          <Route path="/intensity" element={
            <motion.div 
              key="intensity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-50 w-full h-screen"
            >
              <IntensityGlobe />
            </motion.div>
          } />
          <Route path="/cities" element={
            <motion.div 
              key="cities"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-50"
            >
              <Cities />
            </motion.div>
          } />
          <Route path="/landscape" element={
            <motion.div 
              key="landscape"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-50"
            >
              <ClimateLandscape />
            </motion.div>
          } />
        </Routes>
      </AnimatePresence>

    </div>
  );
}

export default App;
