import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface GlobeProps {
  isDark: boolean;
}

const Globe: React.FC<GlobeProps> = ({ isDark }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <mesh ref={meshRef} scale={1.8}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <MeshDistortMaterial
        color={isDark ? '#00BFA5' : '#0077D4'}
        attach="material"
        distort={0.15}
        speed={1}
        roughness={0.2}
        metalness={0.8}
        transparent={true}
        opacity={isDark ? 0.3 : 0.15}
        envMapIntensity={1}
      />
    </mesh>
  );
};

export default Globe;
