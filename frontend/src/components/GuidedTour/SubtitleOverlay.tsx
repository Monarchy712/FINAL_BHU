interface SubtitleOverlayProps {
  paragraph: string;
}

export default function SubtitleOverlay({ paragraph }: SubtitleOverlayProps) {
  if (!paragraph) return null;
  return (
    <div className="subtitle-overlay">
      <div key={paragraph} className="subtitle-box">
        <p className="subtitle-line">
          "{paragraph}"
        </p>
      </div>
    </div>
  );
}
