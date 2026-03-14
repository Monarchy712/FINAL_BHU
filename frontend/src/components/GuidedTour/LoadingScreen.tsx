import { useState, useEffect } from "react";

const LABELS = ["Analyzing your world", "Connecting to the globe", "Crafting your story"];

export default function LoadingScreen() {
  const [dots, setDots] = useState(0);
  const [labelIdx, setLabelIdx] = useState(0);

  // Animated dots: . → .. → ...
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, []);

  // Cycle label text every 2.5 s
  useEffect(() => {
    const id = setInterval(() => setLabelIdx((i) => (i + 1) % LABELS.length), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="loading-screen">
      <div className="cinematic-bg" style={{ backgroundImage: 'url(/assets/tour-bg.png)' }} />
      <div className="loading-orb" />
      <p className="loading-text">
        <span key={labelIdx} style={{ animation: "fadeIn 0.5s ease" }}>
          {LABELS[labelIdx]}
        </span>
        {".".repeat(dots)}
      </p>
    </div>
  );
}
