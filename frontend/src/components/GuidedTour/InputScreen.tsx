import { useEffect, useRef, useState } from "react";

// Animated particle background
function initParticles(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);
  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.4 + 0.3,
    dx: (Math.random() - 0.5) * 0.25,
    dy: (Math.random() - 0.5) * 0.25,
    alpha: Math.random() * 0.5 + 0.1,
  }));

  const onResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", onResize);

  let rafId: number;
  const draw = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
      if (ctx) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,255,${p.alpha})`;
        ctx.fill();
      }
    });
    rafId = requestAnimationFrame(draw);
  };
  draw();
  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", onResize);
  };
}

interface InputScreenProps {
  onSubmit: (data: { location: string; description: string }) => Promise<void>;
  serverError: string;
  onBack: () => void;
}

export default function InputScreen({ onSubmit, serverError, onBack }: InputScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (canvasRef.current) return initParticles(canvasRef.current);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) { setError("Please enter your city."); return; }
    if (!description.trim()) { setError("Please tell us a little about yourself."); return; }
    setError("");
    setLoading(true);
    await onSubmit({ location: location.trim(), description: description.trim() });
    setLoading(false);
  };

  return (
    <div className="input-screen">
      <div className="cinematic-bg" style={{ backgroundImage: 'url(/assets/tour-bg.png)' }} />
      <canvas ref={canvasRef} id="particle-canvas" />

      <div className="input-card">
        <h1>Discover Where Your World Could Take You</h1>
        <p className="subtitle">Let AI craft your cinematic travel story</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="city-input">Your City</label>
            <input
              id="city-input"
              type="text"
              placeholder="e.g. Varanasi"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="desc-input">Tell me about yourself</label>
            <textarea
              id="desc-input"
              rows={4}
              placeholder="I enjoy history, temples, peaceful cities, and architecture."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          {(error || serverError) && (
            <p className="error-msg">{error || serverError}</p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-text-back"
              onClick={onBack}
              disabled={loading}
            >
              ← Back to Enthusiasts
            </button>
            <button
              type="submit"
              className="btn-start"
              id="start-tour-btn"
              disabled={loading}
            >
              {loading ? "Preparing your tour…" : "Start My Guided Tour"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
