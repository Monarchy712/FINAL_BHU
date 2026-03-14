import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Globe from 'react-globe.gl';
import type { GlobeMethods } from 'react-globe.gl';
import * as THREE from 'three';

type MetricType = 'temp' | 'pressure' | 'precip';

interface CityData {
  name: string;
  lat: number;
  lon: number;
  temp: number;
  anomaly: number;
  pressure: number;
  precip: number;
  ml_cluster?: number;
}

function getColor(city: CityData, activeMetric: MetricType): string {
  if (activeMetric === 'temp') {
    const temp = city.temp;
    if (temp > 35) return '#ff0033';
    if (temp > 28) return '#ff6b00';
    if (temp > 20) return '#eab308';
    if (temp > 10) return '#00ff88';
    return '#00f0ff';
  } else if (activeMetric === 'pressure') {
    const pressure = city.pressure || 0;
    if (pressure < 900) return '#bd00ff'; // Extreme Low - Purple
    if (pressure < 1000) return '#00d4ff'; // Low - Cyan
    if (pressure < 1010) return '#00ffaa'; // Standard - Mint
    if (pressure < 1013) return '#c1ff00'; // High-ish - Lime
    if (pressure < 1015) return '#fbbf24'; // High - Amber
    return '#ff4400'; // Extreme High - Orange
  } else if (activeMetric === 'precip') {
    const precip = city.precip || 0;
    if (precip > 4) return '#ff00ff'; // Heavy - Magenta
    if (precip > 2) return '#0066ff'; // Moderate - Vivid Blue
    if (precip > 0.5) return '#00f0ff'; // Light - Arctic Cyan
    return '#ffffff'; // Dry - White
  }
  return '#ffffff'; // Default color
}

export default function SpatialGlobe() {
  const navigate = useNavigate();
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(2020);
  const [fetching, setFetching] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MetricType>('temp');

  const MIN_YEAR = 1940;
  const MAX_YEAR = 2023;

  const fetchData = useCallback(async (year: number, metric: MetricType) => {
    setFetching(true);
    const backendHost = window.location.hostname;
    try {
      const response = await fetch(`http://${backendHost}:8001/city_data_spatial?year=${year}`);
      const data = await response.json();
      setCities(data.cities || []);
    } catch (error) {
      console.error('Error fetching city data:', error);
    } finally {
      setFetching(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedYear, activeMetric);
  }, [selectedYear, activeMetric, fetchData]);

  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      globeRef.current.pointOfView({ lat: 20, lng: 10, altitude: 2.5 });
    }
  }, [loading]);

  const changeYear = (delta: number) => {
    setSelectedYear(prev => {
      const next = prev + delta;
      if (next < MIN_YEAR) return MIN_YEAR;
      if (next > MAX_YEAR) return MAX_YEAR;
      return next;
    });
  };

  const getAltitude = useCallback((d: CityData, metric: MetricType) => {
    let baseH = 0.05;

    if (metric === 'temp') {
      baseH = (Math.abs(d.anomaly) * 0.025) + 0.01;
    } else if (metric === 'pressure') {
      // Exaggerate deviation from 1013
      baseH = Math.max(0.04, Math.abs(d.pressure - 1013) * 0.0006 + 0.02); 
    } else if (metric === 'precip') {
      // Very aggressive scaling for 0-10mm range
      baseH = Math.max(0.02, Math.pow(d.precip, 1.2) * 0.04); 
    }

    return d.__isHovered ? baseH * 3 + 0.1 : baseH;
  }, [activeMetric]);

  const columnsData = cities.map(c => ({
    ...c,
    __isHovered: c.name === hoveredCity
  }));

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/researchers')}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-portal-teal/10 hover:bg-portal-teal/20 border border-portal-teal/30 rounded-full text-portal-teal backdrop-blur-md transition-all group shadow-[0_0_15px_rgba(0,240,255,0.2)]"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-display tracking-widest text-sm">RETURN</span>
      </button>

      {/* Year Selector and Metric Toggle */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
        <div className="flex gap-2 bg-black/50 backdrop-blur-md p-1 rounded-full border border-portal-teal/30">
          <button onClick={() => changeYear(-10)} className="p-3 rounded-full hover:bg-white/10 text-white transition-colors" title="-10 Years" disabled={selectedYear <= MIN_YEAR}>
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <button onClick={() => changeYear(-1)} className="p-3 rounded-full hover:bg-white/10 text-white transition-colors" title="-1 Year" disabled={selectedYear <= MIN_YEAR}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center justify-center px-6 min-w-[140px]">
            <span className="text-sm text-gray-400 tracking-wider">ANNUAL MEAN</span>
            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-[#00f0ff] to-[#0088ff] font-['Space_Grotesk']">
              {selectedYear}
            </span>
          </div>
          <button onClick={() => changeYear(+1)} className="p-3 rounded-full hover:bg-white/10 text-white transition-colors" title="+1 Year" disabled={selectedYear >= MAX_YEAR}>
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={() => changeYear(+10)} className="p-3 rounded-full hover:bg-white/10 text-white transition-colors" title="+10 Years" disabled={selectedYear >= MAX_YEAR}>
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Toggle */}
        <div className="mt-4 flex gap-2 bg-black/50 backdrop-blur-md p-1 rounded-full border border-portal-teal/30">
          <button 
            onClick={() => setActiveMetric('temp')}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${activeMetric === 'temp' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            TEMPERATURE
          </button>
          <button 
            onClick={() => setActiveMetric('pressure')}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${activeMetric === 'pressure' ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            PRESSURE
          </button>
          <button 
            onClick={() => setActiveMetric('precip')}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${activeMetric === 'precip' ? 'bg-gradient-to-r from-indigo-400 to-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            PRECIPITATION
          </button>
        </div>
      </div>

      {/* Hover Info */}
      {hoveredCity && (
        <div className="absolute top-6 right-6 z-50 bg-black/80 border border-portal-teal/40 backdrop-blur-md rounded-xl px-6 py-4 text-white shadow-[0_0_30px_rgba(0,240,255,0.15)]">
          {(() => {
            const city = cities.find(c => c.name === hoveredCity);
            if (!city) return null;
            return (
              <>
                <h3 className="font-display text-lg tracking-widest text-portal-teal">{city.name.toUpperCase()}</h3>
                <div className="mt-2 flex justify-between gap-8 text-sm">
                  <span className="text-gray-500">TEMP</span>
                  <span style={{ color: getColor(city, 'temp') }} className="font-bold">{city.temp.toFixed(1)}°C</span>
                </div>
                <div className="mt-1 flex justify-between gap-8 text-sm">
                  <span className="text-gray-500">ANOMALY</span>
                  <span style={{ color: city.anomaly > 0 ? '#ff3333' : '#00f0ff' }} className="font-bold">
                    {city.anomaly > 0 ? '+' : ''}{city.anomaly.toFixed(2)}°C
                  </span>
                </div>
                <div style={{ marginTop: '1px' }} className="mt-1 flex justify-between gap-8 text-sm">
                  <span className="text-gray-500">PRESSURE</span>
                  <span style={{ color: getColor(city, 'pressure') }} className="font-bold">{city.pressure.toFixed(1)} hPa</span>
                </div>
                <div style={{ marginTop: '1px' }} className="mt-1 flex justify-between gap-8 text-sm">
                  <span className="text-gray-500">PRECIP</span>
                  <span style={{ color: getColor(city, 'precip') }} className="font-bold">{city.precip.toFixed(1)} mm</span>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Title */}
      <div className="absolute bottom-10 right-10 z-50 pointer-events-none text-right">
        <h2 className="font-display text-4xl font-bold tracking-wider text-portal-neon drop-shadow-[0_0_10px_rgba(100,255,218,0.5)]">
          SPATIAL ANOMALIES
        </h2>
        <p className="text-portal-teal/70 font-sans mt-2 max-w-sm ml-auto">
          Annual mean temperature dunes. Height = thermal intensity anomaly.
        </p>
      </div>

      {(loading || fetching) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-[100] backdrop-blur-sm">
          <div className="relative w-80 h-1 bg-portal-teal/10 overflow-hidden mb-6">
            <div className="absolute top-0 left-0 h-full bg-portal-teal w-1/2 animate-shimmer" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-portal-teal font-display text-xs tracking-[0.3em] animate-pulse">STOCHASTIC DATA RECONSTRUCTION</span>
            <div className="flex gap-1">
              <span className="text-portal-teal/40 text-[10px] font-mono">ESTABLISHING CONNECTION...</span>
              <span className="text-portal-teal text-[10px] font-mono animate-bounce delay-100">_</span>
            </div>
          </div>
          {/* Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-portal-teal/5 to-transparent h-20 w-full animate-scan" />
          
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
            @keyframes scan {
              0% { top: -20%; }
              100% { top: 120%; }
            }
            .animate-shimmer { animation: shimmer 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
            .animate-scan { animation: scan 4s linear infinite; }
          `}} />
        </div>
      )}

      {!loading && (
        <div className="w-full h-full cursor-grab active:cursor-grabbing">
          <Globe
            ref={globeRef as any}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            backgroundColor="rgba(0,0,0,0)"
            showAtmosphere={true}
            atmosphereColor="#00f0ff"
            atmosphereAltitude={0.15}

            customLayerData={columnsData}
            customThreeObject={(d: any) => {
              const h = getAltitude(d, activeMetric);
              // Ensure we have a valid height before creating geometry
              const safeH = Math.max(0.01, isNaN(h) ? 0.05 : h);
              // Radius is significantly wider to make hovering much easier
              const r = d.__isHovered ? 2.5 : 1.8;
              const geometry = new THREE.CylinderGeometry(r/2, r, safeH, 32);
              geometry.translate(0, safeH / 2, 0);
              geometry.rotateX(Math.PI / 2);

              const color = getColor(d, activeMetric);
              const material = new THREE.MeshPhongMaterial({
                color: color,
                transparent: true,
                opacity: d.__isHovered ? 0.9 : 0.65,
                shininess: d.__isHovered ? 80 : 30,
                emissive: color,
                emissiveIntensity: d.__isHovered ? 0.4 : 0.1
              });
              return new THREE.Mesh(geometry, material);
            }}
            customThreeObjectUpdate={(obj: any, d: any) => {
              Object.assign(obj.position, globeRef.current?.getCoords(d.lat, d.lon, 0.005));
            }}
            onCustomLayerHover={(obj: any) => {
              if (obj) {
                setHoveredCity(obj.name);
                if (globeRef.current) globeRef.current.controls().autoRotate = false;
              } else {
                setHoveredCity(null);
                if (globeRef.current) globeRef.current.controls().autoRotate = true;
              }
            }}

            pointsData={cities}
            pointLat="lat"
            pointLng="lon"
            pointColor={(d: object) => getColor(d as CityData, activeMetric)}
            pointAltitude={(d: object) => {
              const city = columnsData.find(c => c.name === (d as CityData).name);
              // Float the point bubble just above the cylinder
              return city && city.__isHovered ? getAltitude(city, activeMetric) + 0.05 : getAltitude(d as CityData, activeMetric) + 0.02;
            }}
            pointRadius={1.5}
            onPointHover={(city: object | null) => {
              if (city) {
                setHoveredCity((city as CityData).name);
                if (globeRef.current) globeRef.current.controls().autoRotate = false;
              } else {
                setHoveredCity(null);
                if (globeRef.current) globeRef.current.controls().autoRotate = true;
              }
            }}
            pointLabel={(d: object) => {
              const city = d as CityData;
              const labelColor = getColor(city, activeMetric);
              
              return `
                <div style="background: rgba(10,10,20,0.9); border: 1px solid ${labelColor}; padding: 12px; border-radius: 8px; font-family: sans-serif; box-shadow: 0 0 15px ${labelColor}40;">
                  <strong style="color: white; font-size: 1.1rem; letter-spacing: 1px;">${city.name.toUpperCase()}</strong><br/>
                  <div style="margin-top: 8px; display: flex; justify-content: space-between; gap: 20px;">
                    <span style="color: #888; font-size: 0.8rem;">TEMP</span>
                    <span style="color: ${getColor(city, 'temp')}; font-weight: bold;">${city.temp.toFixed(1)}°C</span>
                  </div>
                  <div style="margin-top: 4px; display: flex; justify-content: space-between; gap: 20px;">
                    <span style="color: #888; font-size: 0.8rem;">ANOMALY</span>
                    <span style="color: ${city.anomaly > 0 ? '#ff3333' : '#00f0ff'}; font-weight: bold;">${city.anomaly > 0 ? '+' : ''}${city.anomaly.toFixed(2)}°C</span>
                  </div>
                  <div style="margin-top: 4px; display: flex; justify-content: space-between; gap: 20px;">
                    <span style="color: #888; font-size: 0.8rem;">PRESSURE</span>
                    <span style="color: ${getColor(city, 'pressure')}; font-weight: bold;">${city.pressure ? city.pressure.toFixed(1) : '--'} hPa</span>
                  </div>
                  <div style="margin-top: 4px; display: flex; justify-content: space-between; gap: 20px;">
                    <span style="color: #888; font-size: 0.8rem;">PRECIP</span>
                    <span style="color: ${getColor(city, 'precip')}; font-weight: bold;">${city.precip ? city.precip.toFixed(1) : '--'} mm</span>
                  </div>
                  ${city.ml_cluster !== undefined ? `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed ${labelColor}60; display: flex; justify-content: space-between; gap: 20px;">
                    <span style="color: #aaa; font-size: 0.75rem;">ML CLUSTER (K-MEANS)</span>
                    <span style="color: #fff; font-weight: bold; font-family: monospace;">GROUP ${city.ml_cluster}</span>
                  </div>
                  ` : ''}
                </div>
              `;
            }}
          />
        </div>
      )}
    </div>
  );
}
