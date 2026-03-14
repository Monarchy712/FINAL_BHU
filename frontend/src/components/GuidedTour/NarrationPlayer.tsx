import { useEffect, useRef } from "react";

interface NarrationPlayerProps {
  paragraph: string;
  onEnded: () => void;
}

export default function NarrationPlayer({ paragraph, onEnded }: NarrationPlayerProps) {
  const lastParagraphRef = useRef<string | null>(null);

  useEffect(() => {
    // Cancel any existing speech before starting new (prevents overlap)
    window.speechSynthesis.cancel();

    if (!paragraph || paragraph === lastParagraphRef.current) return;
    lastParagraphRef.current = paragraph;

    const utterance = new SpeechSynthesisUtterance(paragraph);
    utterance.lang = "en-US";
    utterance.rate = 0.8;
    utterance.pitch = 1;

    const startSpeech = () => {
      const voices = window.speechSynthesis.getVoices();

      // Specifically prioritize US Female voices (Natural/Online preferred)
      const preferredVoice =
        voices.find(v => v.name.includes("Aria") || v.name.includes("Jenny") || v.name.includes("Samantha") || v.name.includes("Google US English")) ||
        voices.find(v => v.lang === "en-US" && (v.name.includes("Female") || v.name.includes("Online"))) ||
        voices.find(v => v.lang === "en-US") ||
        voices.find(v => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = "en-US";
      }

      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = startSpeech;
    } else {
      startSpeech();
    }

    utterance.onend = () => {
      if (onEnded) onEnded();
    };
  }, [paragraph, onEnded]);

  // Cancel on unmount (e.g. user presses Go Back)
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return null;
}
