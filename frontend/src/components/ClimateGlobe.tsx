import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uScanTime;
  uniform float uGlowIntensity;
  uniform float uLayer;
  uniform float uNextLayer;
  uniform float uTransition;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  // ... (Simplex Noise Code) ...
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0 ); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 1.0/7.0; 
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  // --- Layer Visuals ---

  vec3 getTemp(vec3 pos) {
    float n = snoise(pos * 1.5 + uTime * 0.1) * 0.5 + 0.5;
    n = n * (1.0 - abs(pos.y * 0.8)); // Hotter at equator
    vec3 color = mix(vec3(0.0, 0.2, 0.8), vec3(0.0, 0.8, 0.4), smoothstep(0.0, 0.4, n));
    color = mix(color, vec3(0.8, 0.8, 0.0), smoothstep(0.4, 0.7, n));
    color = mix(color, vec3(1.0, 0.2, 0.0), smoothstep(0.7, 1.0, n));
    return color * 1.5;
  }

  vec3 getWind(vec3 pos) {
    float n = snoise(vec3(pos.x * 5.0 - uTime * 1.5, pos.y * 3.0, pos.z * 5.0));
    float streak = smoothstep(0.4, 0.6, abs(n));
    return vec3(0.4, 0.8, 1.0) * streak * 2.0;
  }

  vec3 getOcean(vec3 pos) {
    float n = snoise(vec3(pos.x * 3.0, pos.y * 8.0 - uTime * 0.5, pos.z * 3.0));
    float streak = smoothstep(0.3, 0.5, abs(n));
    return vec3(0.0, 0.5, 1.0) * streak * 1.5;
  }

  vec3 getPrecip(vec3 pos) {
    float n = snoise(pos * 4.0 + uTime * 0.5);
    float drop = smoothstep(0.6, 0.8, n);
    return vec3(0.2, 0.6, 1.0) * drop * 2.5;
  }

  vec3 getPressure(vec3 pos) {
    float n = snoise(pos * 2.0 + uTime * 0.1);
    float lines = fract(n * 8.0);
    float line = smoothstep(0.85, 0.95, lines);
    return vec3(0.6, 0.9, 1.0) * line * 1.5;
  }

  vec3 getLayerColor(float layer, vec3 pos) {
    if (layer < 0.5) return getTemp(pos);
    if (layer < 1.5) return getWind(pos);
    if (layer < 2.5) return getOcean(pos);
    if (layer < 3.5) return getPrecip(pos);
    return getPressure(pos);
  }

  void main() {
    float gridU = 1.0 - abs(fract(vUv.x * 36.0) - 0.5) * 2.0;
    float gridV = 1.0 - abs(fract(vUv.y * 18.0) - 0.5) * 2.0;
    float grid = smoothstep(0.9, 1.0, max(gridU, gridV));
    vec3 gridColor = vec3(0.0, 0.4, 0.3) * grid * 0.8;

    vec3 col1 = getLayerColor(uLayer, vPosition);
    vec3 col2 = getLayerColor(uNextLayer, vPosition);
    vec3 dataColor = mix(col1, col2, uTransition);

    float scanTime = fract(uScanTime / 4.0);
    float scanPos = 1.2 - scanTime * 2.4;
    float dist = abs(vPosition.y - scanPos);
    float scanWave = smoothstep(0.03, 0.0, dist);
    float trail = smoothstep(0.3, 0.0, vPosition.y - scanPos) * step(scanPos, vPosition.y);
    vec3 sonarColor = vec3(0.0, 1.0, 0.7) * (scanWave + trail * 0.5) * uGlowIntensity;

    float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    rim = smoothstep(0.6, 1.0, rim);
    vec3 rimColor = vec3(0.0, 0.6, 0.8) * rim * 1.5;

    vec3 finalColor = gridColor + dataColor + sonarColor + rimColor;
    
    float alpha = 0.2 + grid * 0.3 + scanWave * 0.8 + trail * 0.4;
    alpha = max(alpha, length(dataColor) * 0.4); 
    alpha = max(alpha, rim * 0.8);

    gl_FragColor = vec4(finalColor, min(alpha, 1.0));
  }
`;

export default function ClimateGlobe({ isHovered }: { isHovered: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const internalState = useRef({
    currentLayer: 0,
    nextLayer: 0,
    transition: 0.0,
    scanTime: 0.0,
    currentSpeed: 1.0,
    currentGlow: 1.0
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScanTime: { value: 0 },
      uGlowIntensity: { value: 1.0 },
      uLayer: { value: 0 },
      uNextLayer: { value: 0 },
      uTransition: { value: 0 }
    }),
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      internalState.current.currentLayer = internalState.current.nextLayer;
      internalState.current.nextLayer = (internalState.current.currentLayer + 1) % 5;
      internalState.current.transition = 0.0;
      
      if (materialRef.current) {
        materialRef.current.uniforms.uLayer.value = internalState.current.currentLayer;
        materialRef.current.uniforms.uNextLayer.value = internalState.current.nextLayer;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useFrame((state, delta) => {
    if (!materialRef.current) return;
    
    const targetSpeed = isHovered ? 10.0 : 1.0;
    const targetGlow = isHovered ? 1.8 : 1.0;

    // Smoothly interpolate speed and glow
    internalState.current.currentSpeed = THREE.MathUtils.lerp(
      internalState.current.currentSpeed,
      targetSpeed,
      0.1 // ~0.3s transition
    );
    internalState.current.currentGlow = THREE.MathUtils.lerp(
      internalState.current.currentGlow,
      targetGlow,
      0.1
    );

    // Update uScanTime based on variable speed
    internalState.current.scanTime += delta * internalState.current.currentSpeed;
    
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uScanTime.value = internalState.current.scanTime;
    materialRef.current.uniforms.uGlowIntensity.value = internalState.current.currentGlow;
    
    if (internalState.current.transition < 1.0) {
      internalState.current.transition += 0.01; 
      materialRef.current.uniforms.uTransition.value = Math.min(internalState.current.transition, 1.0);
    }
  });

  return (
    <mesh rotation={[0.2, 0, -0.2]}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
