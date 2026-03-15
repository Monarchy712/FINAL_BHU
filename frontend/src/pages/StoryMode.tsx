import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ──────────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────────── */
interface Chapter {
  icon:    string;
  heading: string;
  line:    string;
}

interface StoryData {
  title:    string;
  subtitle: string;
  chapters: Chapter[];
}

/* ──────────────────────────────────────────────────────────────────────
   Particle canvas (emerald theme)
   ────────────────────────────────────────────────────────────────────── */
const EmeraldParticles: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    let raf: number;
    const particles: { x:number; y:number; vx:number; vy:number; r:number; a:number }[] = [];
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    window.addEventListener('resize', resize); resize();
    for (let i = 0; i < 60; i++) particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      r: Math.random() * 1.8 + 0.4,
      a: Math.random() * 0.35 + 0.08,
    });
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < 0) p.y = c.height;
        if (p.x < 0) p.x = c.width;
        if (p.x > c.width) p.x = 0;
        ctx.fillStyle = `rgba(52,211,153,${p.a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" />;
};

/* ──────────────────────────────────────────────────────────────────────
   Typewriter text
   ────────────────────────────────────────────────────────────────────── */
const TypewriterText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    setDisplayed('');
    let i = 0;
    const iv = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(iv);
    }, 18);
    return () => clearInterval(iv);
  }, [text, started]);

  return (
    <span>
      {displayed}
      {started && displayed.length < text.length && (
        <span className="animate-pulse text-emerald-400">|</span>
      )}
    </span>
  );
};

/* ──────────────────────────────────────────────────────────────────────
   Chapter card
   ────────────────────────────────────────────────────────────────────── */
interface ChapterCardProps {
  chapter: Chapter;
  index:   number;
  visible: boolean;
}

const ChapterCard: React.FC<ChapterCardProps> = ({ chapter, index, visible }) => (
  <div
    style={{
      opacity:   visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.7s ease ${index * 200}ms, transform 0.7s ease ${index * 200}ms`,
    }}
    className="story-chapter-card"
  >
    <div className="story-chapter-icon">{chapter.icon}</div>
    <div className="story-chapter-body">
      <h3 className="story-chapter-heading">{chapter.heading}</h3>
      <p className="story-chapter-line">
        {visible && (
          <TypewriterText text={chapter.line} delay={index * 600 + 400} />
        )}
      </p>
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────
   Main page
   ────────────────────────────────────────────────────────────────────── */
export default function StoryMode() {
  const navigate = useNavigate();

  // Phase: 'input' | 'loading' | 'story' | 'error'
  const [phase,    setPhase]    = useState<'input' | 'loading' | 'story' | 'error'>('input');
  const [location, setLocation] = useState('');
  const [date,     setDate]     = useState('');
  const [story,    setStory]    = useState<StoryData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [chaptersVisible, setChaptersVisible] = useState(false);

  // Max date = today
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !date) return;

    setPhase('loading');
    try {
      const res = await fetch('/generate-story', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ location: location.trim(), date }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setStory(data.story);
      setPhase('story');
      // Stagger chapter reveal after mount
      setTimeout(() => setChaptersVisible(true), 300);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setPhase('error');
    }
  };

  const reset = () => {
    setPhase('input');
    setStory(null);
    setChaptersVisible(false);
    setErrorMsg('');
  };

  return (
    <div className="story-page">
      {/* Background layers */}
      <div className="story-bg-base" />
      <div className="story-nebula sn-1" />
      <div className="story-nebula sn-2" />
      <div className="story-nebula sn-3" />
      <EmeraldParticles />

      {/* Back button — always visible */}
      <button
        onClick={() => navigate('/enthusiasts')}
        className="story-back-btn"
        aria-label="Back to Enthusiasts"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      {/* ── INPUT PHASE ─────────────────────────── */}
      {phase === 'input' && (
        <div className="story-center">
          <div className="story-input-card">
            {/* Book icon / title */}
            <div className="story-input-header">
              <div className="story-book-icon">
                <BookOpen size={36} strokeWidth={1.5} />
              </div>
              <h1 className="story-input-title">Climate Story</h1>
              <p className="story-input-subtitle">
                Enter a place and a date — we'll tell you what it was like to be there.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="story-form">
              <div className="story-field">
                <label className="story-label">Location</label>
                <input
                  type="text"
                  className="story-input"
                  placeholder="e.g. Mumbai, New Delhi, Cairo…"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="story-field">
                <label className="story-label">Date</label>
                <input
                  type="date"
                  className="story-input story-date-input"
                  value={date}
                  max={today}
                  min="1940-01-01"
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="story-cta-btn">
                <BookOpen size={18} />
                Begin the Journey
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── LOADING PHASE ────────────────────────── */}
      {phase === 'loading' && (
        <div className="story-center">
          <div className="story-loading">
            <div className="story-loading-book">
              <div className="slb-cover slb-left" />
              <div className="slb-cover slb-right" />
              <div className="slb-pages" />
            </div>
            <Loader2 size={28} className="story-loading-spinner" />
            <p className="story-loading-text">Consulting the climate archives…</p>
            <p className="story-loading-sub">Reading the data from {location}</p>
          </div>
        </div>
      )}

      {/* ── ERROR PHASE ─────────────────────────── */}
      {phase === 'error' && (
        <div className="story-center">
          <div className="story-error-card">
            <div className="story-error-icon">⚠️</div>
            <h2 className="story-error-title">Story Unavailable</h2>
            <p className="story-error-msg">{errorMsg}</p>
            <button onClick={reset} className="story-cta-btn" style={{ marginTop: '1.5rem' }}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ── STORY PHASE ─────────────────────────── */}
      {phase === 'story' && story && (
        <div className="story-display">
          {/* Header */}
          <div className="story-display-header">
            <h1 className="story-display-title">{story.title}</h1>
            <p className="story-display-subtitle">{story.subtitle}</p>
            <div className="story-display-divider" />
          </div>

          {/* Chapters */}
          <div className="story-chapters">
            {story.chapters.map((ch, i) => (
              <ChapterCard
                key={i}
                chapter={ch}
                index={i}
                visible={chaptersVisible}
              />
            ))}
          </div>

          {/* Replay / new story */}
          <button onClick={reset} className="story-new-btn">
            <BookOpen size={16} />
            Tell another story
          </button>
        </div>
      )}
    </div>
  );
}
