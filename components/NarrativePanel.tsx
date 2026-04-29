"use client";

import { useEffect, useState } from "react";
import type { Persona, Stop } from "@/lib/types";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function NarrativePanel({
  walkId,
  stops,
  personas,
  activeIndex,
  setActiveIndex,
}: {
  walkId: string;
  stops: Stop[];
  personas: Persona[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
}) {
  const [personaId, setPersonaId] = useState(personas[0]?.id ?? "");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const stop = stops[activeIndex];

  useEffect(() => {
    if (!stop || !personaId) return;
    let cancelled = false;
    setText("");
    setLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/narrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walkId, stopId: stop.id, personaId }),
        });
        if (!res.body) {
          setLoading(false);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (cancelled) break;
          setText((t) => t + decoder.decode(value, { stream: true }));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [walkId, stop, personaId]);

  return (
    <div className="h-full flex flex-col">
      {/* Persona selector */}
      <div className="px-6 pt-6 pb-4 border-b border-ink/10">
        <p className="eyebrow mb-2">Telling the story to</p>
        <div className="flex flex-wrap gap-2">
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => setPersonaId(p.id)}
              className={`px-3 py-1.5 text-sm rounded-sm transition-colors border ${
                personaId === p.id
                  ? "bg-ink text-parchment border-ink"
                  : "border-ink/20 text-ink hover:border-ink/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stop header */}
      <div className="px-6 py-5">
        <p className="eyebrow mb-1">
          Stop {activeIndex + 1} of {stops.length}
        </p>
        <h2 className="serif text-4xl leading-tight">{stop.name}</h2>
        <p className="text-muted italic mt-1">{stop.subtitle}</p>
      </div>

      <hr className="divider-rule mx-6" />

      {/* Narrative */}
      <div className="px-6 pb-8 flex-1 overflow-y-auto">
        {loading && text.length === 0 ? (
          <div className="flex items-center gap-2 text-muted eyebrow">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Researching · Storytelling · Critiquing</span>
          </div>
        ) : null}
        <div className="narrative whitespace-pre-wrap">{text}</div>
      </div>

      {/* Nav */}
      <div className="px-6 py-4 border-t border-ink/10 flex justify-between items-center">
        <button
          onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
          disabled={activeIndex === 0}
          className="flex items-center gap-1 text-sm disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <span className="eyebrow">{stop.id}</span>
        <button
          onClick={() =>
            setActiveIndex(Math.min(stops.length - 1, activeIndex + 1))
          }
          disabled={activeIndex === stops.length - 1}
          className="flex items-center gap-1 text-sm disabled:opacity-30"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
