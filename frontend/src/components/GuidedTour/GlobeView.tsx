import { useCallback, useEffect, useRef, useState } from "react";
import SubtitleOverlay from "./SubtitleOverlay";
import NarrationPlayer from "./NarrationPlayer";

interface City {
  name: string;
  lat: number;
  lng: number;
  paragraph: string;
}

interface TourData {
  cities: City[];
}

interface GlobeViewProps {
  tourData: TourData;
  onGoBack: () => void;
}

export default function GlobeView({ tourData, onGoBack }: GlobeViewProps) {
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<any>(null);
  const cityIndexRef = useRef<number>(0);

  const [currentCityIdx, setCurrentCityIdx] = useState(0);
  const [currentParagraph, setCurrentParagraph] = useState("");
  const [showBackButton, setShowBackButton] = useState(false);

  const { cities } = tourData;

  // ── Visit a specific city index on the globe ──────────────────────────────
  const visitCity = useCallback((index: number) => {
    if (index >= cities.length) {
      setShowBackButton(true);
      return;
    }

    const city = cities[index];
    setCurrentCityIdx(index);
    setCurrentParagraph(city.paragraph);

    const globe = globeInstanceRef.current;
    if (globe) {
      globe.pointsData([city]);
      globe.labelsData([city]);
      globe.controls().autoRotate = false;
      // Briefly zoom out then zoom into city for dramatic effect
      setTimeout(() => {
        globe.pointOfView({ lat: city.lat, lng: city.lng, altitude: 0.28 }, 3500);
      }, 300);
    }
  }, [cities]);

  // Called by NarrationPlayer when the current paragraph finishes speaking
  const handleNarrationEnd = useCallback(() => {
    const nextIndex = cityIndexRef.current + 1;
    cityIndexRef.current = nextIndex;
    // Small pause before transitioning to next city
    setTimeout(() => visitCity(nextIndex), 1200);
  }, [visitCity]);

  // ── Initialize globe.gl ──────────────────────────────────────────────────
  useEffect(() => {
    if (!globeContainerRef.current) return;
    let instance: any;

    import("globe.gl").then((mod) => {
      const Globe = mod.default;
      if (!globeContainerRef.current) return;
      instance = (Globe as any)()(globeContainerRef.current)
        .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .backgroundColor("#000000")
        .showAtmosphere(true)
        .atmosphereColor("#00E5FF")
        .atmosphereAltitude(0.28)

        // City markers — aurora green glow
        .pointsData([])
        .pointLat((d: any) => d.lat)
        .pointLng((d: any) => d.lng)
        .pointAltitude(0.04)
        .pointRadius(0.6)
        .pointColor(() => "#2AFFA1")
        .pointResolution(24)
        .pointsMerge(false)

        // City labels
        .labelsData([])
        .labelLat((d: any) => d.lat)
        .labelLng((d: any) => d.lng)
        .labelAltitude(0.05)
        .labelText((d: any) => d.name)
        .labelSize(0.7)
        .labelDotRadius(0.3)
        .labelColor(() => "#00E5FF")
        .labelResolution(3)

        .enablePointerInteraction(false);

      // Initial global overview
      instance.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1500);
      instance.controls().autoRotate = true;
      instance.controls().autoRotateSpeed = 0.3;
      instance.controls().enableZoom = false;

      const handleResize = () => {
        if (instance) {
          instance.width(window.innerWidth);
          instance.height(window.innerHeight);
        }
      };
      window.addEventListener("resize", handleResize);
      handleResize();

      globeInstanceRef.current = instance;

      // Start tour after globe settles
      setTimeout(() => {
        cityIndexRef.current = 0;
        visitCity(0);
      }, 2000);
    });

    return () => {
      if (globeContainerRef.current) globeContainerRef.current.innerHTML = "";
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentCity = cities[currentCityIdx];

  return (
    <div className="globe-screen">
      {/* Aurora background layer */}
      <div className="aurora-bg" aria-hidden="true" />

      {/* City indicator */}
      <div className="city-progress">
        <span className="city-progress-label">Exploring</span>
        <span className="city-progress-name" key={currentCityIdx}>
          📍 {currentCity?.name}
        </span>
        <span className="city-progress-counter">
          {currentCityIdx + 1} / {cities.length}
        </span>
      </div>

      {/* 3D Globe */}
      <div
        className="globe-wrapper"
        style={{ width: "100vw", height: "100vh", position: "absolute", top: 0, left: 0 }}
      >
        <div ref={globeContainerRef} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* Per-city narration via browser TTS */}
      <NarrationPlayer
        paragraph={currentParagraph}
        onEnded={handleNarrationEnd}
      />

      {/* Climate subtitle panel */}
      <SubtitleOverlay paragraph={currentParagraph} />

      {/* Go Back */}
      {showBackButton && (
        <button className="back-button" onClick={onGoBack}>
          ← Explore Another City
        </button>
      )}
    </div>
  );
}
