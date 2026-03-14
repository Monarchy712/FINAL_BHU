import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import ClimateGlobe from './ClimateGlobe';

interface Props {
  isDark: boolean;
  activeMode: 'researchers' | 'enthusiasts' | null;
  isHovered: boolean;
}

const CameraController = ({ activeMode }: { activeMode: 'researchers' | 'enthusiasts' | null }) => {
  useFrame((state) => {
    // Cinematic flight toward the globe when enthusiasts mode is active
    let targetZ = 3.5;
    let targetX = 0;
    
    if (activeMode === 'enthusiasts') {
      targetZ = 1.3; // Fly in very close
      targetX = -0.5; // Offset to side
    } else if (activeMode === 'researchers') {
      targetZ = 4.5; // Pull back for laboratory feel
      targetX = 1.0; 
    }
    
    state.camera.position.lerp(new THREE.Vector3(targetX, 0, targetZ), 0.05);
    state.camera.lookAt(targetX * 0.2, 0, 0); 
  });
  return null;
};

const BackgroundEffects: React.FC<Props> = ({ isDark, activeMode, isHovered }) => {
  return (
    <div className={`absolute inset-0 z-0 pointer-events-none transition-colors duration-1000 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        {isDark && <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />}
        
        <CameraController activeMode={activeMode} />
        
        <ClimateGlobe isHovered={isHovered} />
      </Canvas>
    </div>
  );
};

export default BackgroundEffects;
