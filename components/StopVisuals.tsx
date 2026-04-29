"use client";

import { useEffect, useRef, useState } from "react";
import type { Stop } from "@/lib/types";
import { Volume2, Square, Clock, Ticket, Footprints, Accessibility, Sun } from "lucide-react";

export default function StopVisuals({
  stop,
  narrativeText,
}: {
  stop: Stop;
  narrativeText: string;
}) {
  const visit = stop.visit_info;

  return (
    <div className="my-6 space-y-5">
      {/* Voice + visit info row */}
      <div className="flex flex-wrap items-start gap-4">
        <VoicePlayer text={narrativeText} />
        {visit && <VisitInfoCard visit={visit} />}
      </div>
    </div>
  );
}

function VisitInfoCard({ visit }: { visit: NonNullable<Stop["visit_info"]> }) {
  const Row = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: typeof Clock;
    label: string;
    value: string;
  }) => (
    <div className="flex items-start gap-2 text-xs">
      <Icon className="w-3.5 h-3.5 mt-0.5 text-muted shrink-0" />
      <div className="flex-1">
        <span className="eyebrow block text-[0.6rem]">{label}</span>
        <span className="text-ink/85">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-w-[240px] border border-ink/10 rounded-sm p-3 space-y-2 bg-ink/[0.015]">
      <p className="eyebrow mb-1">Visit info</p>
      <Row icon={Ticket} label="Entry" value={visit.entry} />
      <Row icon={Clock} label="Hours" value={visit.hours} />
      <Row icon={Sun} label="Best time" value={visit.best_time} />
      <Row icon={Accessibility} label="Access" value={visit.accessibility} />
      <Row icon={Footprints} label="Typical visit" value={visit.duration_typical} />
    </div>
  );
}

/* Browser-native TTS player. No external API. Works offline. */
function VoicePlayer({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Cancel speech if narrative text changes (new stop / persona)
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [text]);

  function strip(s: string): string {
    // Remove citations like [Source, year], markdown markers, asterisks
    return s
      .replace(/\[[^\]]+\]/g, "")
      .replace(/\*\*?/g, "")
      .replace(/_/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function start() {
    if (!supported || !text) return;
    const utter = new SpeechSynthesisUtterance(strip(text));
    utter.rate = 0.95;
    utter.pitch = 1.0;
    // Try to pick a less-robotic English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /en-(GB|IN|US)/i.test(v.lang) && /female/i.test(v.name)) ??
      voices.find((v) => /en-/i.test(v.lang)) ??
      voices[0];
    if (preferred) utter.voice = preferred;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  }

  function stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }

  if (!supported) {
    return (
      <div className="text-xs text-muted italic">
        Voice not supported in this browser.
      </div>
    );
  }

  return (
    <button
      onClick={speaking ? stop : start}
      disabled={!text}
      className="flex items-center gap-2 px-3 py-2 border border-ink/15 rounded-sm hover:border-terracotta hover:text-terracotta transition-colors text-sm disabled:opacity-30"
    >
      {speaking ? (
        <>
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Stop reading</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5" />
          <span>Read aloud</span>
        </>
      )}
    </button>
  );
}