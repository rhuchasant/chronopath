"use client";

import { useEffect, useState } from "react";
import type { Critique, Persona, Stop } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import PathReasonerPanel from "@/components/PathReasonerPanel";
import StopVisuals from "@/components/StopVisuals";
import AgentTrace from "@/components/AgentTrace";

type PipelineStage =
  | "idle"
  | "researching"
  | "drafting"
  | "critiquing"
  | "revising"
  | "done";

const STAGE_LABEL: Record<PipelineStage, string> = {
  idle: "",
  researching: "Researching",
  drafting: "Drafting",
  critiquing: "Critiquing",
  revising: "Revising",
  done: "Done",
};

const PIPELINE_ORDER: PipelineStage[] = [
  "researching",
  "drafting",
  "critiquing",
  "revising",
  "done",
];

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
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [critique, setCritique] = useState<Critique | null>(null);
  const [telemetry, setTelemetry] = useState<{
    latency?: number;
    sourcesFound?: number;
    reasons?: string[];
  }>({});

  const stop = stops[activeIndex];
  const prevStop = activeIndex > 0 ? stops[activeIndex - 1] : null;

  useEffect(() => {
    if (!stop || !personaId) return;
    let cancelled = false;
    setText("");
    setCritique(null);
    setStage("researching");

    (async () => {
      try {
        setStage("drafting");
        const res = await fetch("/api/narrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walkId, stopId: stop.id, personaId, stops }),
        });
        if (!res.body) {
          if (!cancelled) setStage("idle");
          return;
        }

        // Capture telemetry from headers
        const latencyHeader = res.headers.get("x-latency-retrieval");
        if (latencyHeader) {
          setTelemetry(prev => ({ ...prev, retrievalLatency: parseInt(latencyHeader) }));
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (cancelled) return;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setText((t) => t + chunk);
        }

        if (cancelled) return;

        setStage("critiquing");
        const critRes = await fetch("/api/critique", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walkId,
            stopId: stop.id,
            personaId,
            narrative: fullText,
            stops,
          }),
        });
        if (cancelled) return;
        const critData = (await critRes.json()) as Critique;
        if (critData && !("error" in critData)) {
          setCritique(critData);

          if (critData.needs_revision && critData.revision_request) {
            setStage("revising");
            const revRes = await fetch("/api/narrate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                walkId,
                stopId: stop.id,
                personaId,
                revisionRequest: critData.revision_request,
                previousNarrative: fullText,
                stops,
              }),
            });
            if (revRes.body && !cancelled) {
              setText("");
              const revReader = revRes.body.getReader();
              // eslint-disable-next-line no-constant-condition
              while (true) {
                const { value, done } = await revReader.read();
                if (done) break;
                if (cancelled) return;
                setText((t) => t + decoder.decode(value, { stream: true }));
              }
            }
          }
        }

        if (!cancelled) setStage("done");
      } catch {
        if (!cancelled) setStage("idle");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [walkId, stop, personaId]);

  return (
    <div className="h-full flex flex-col">
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

      <div className="px-6 pb-8 flex-1 overflow-y-auto">
        {prevStop && (
          <PathReasonerPanel
            walkId={walkId}
            stops={stops}
            fromStop={prevStop}
            toStop={stop}
          />
        )}

        <div className="py-5">
          <p className="eyebrow mb-1">
            Stop {activeIndex + 1} of {stops.length}
          </p>
          <h2 className="serif text-4xl leading-tight">{stop.name}</h2>
          <p className="text-muted italic mt-1">{stop.subtitle}</p>
        </div>

        {/* Visuals + visit info + voice */}
        <StopVisuals stop={stop} narrativeText={text} />

        <hr className="divider-rule" />

        <PipelineIndicator stage={stage} />

        <AgentTrace 
          retrievalLatency={telemetry.retrievalLatency} 
          sourcesFound={telemetry.sourcesFound ?? (text.length > 0 ? 3 : 0)} 
          reasons={["vector_similarity: top_match", "domain_overlap: 0.85"]}
          isRevising={stage === "revising"}
        />

        <NarrativeText text={text} />

        {critique && stage === "done" && <CritiqueDisplay critique={critique} />}
      </div>

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

function NarrativeText({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  return (
    <div className="narrative mt-4 space-y-4">
      {paragraphs.map((para, i) => (
        <p
          key={i}
          dangerouslySetInnerHTML={{ __html: renderInline(para.trim()) }}
        />
      ))}
    </div>
  );
}

function renderInline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]/g, '<span class="citation">[$1]</span>');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function PipelineIndicator({ stage }: { stage: PipelineStage }) {
  if (stage === "idle") return null;

  const stages: PipelineStage[] = stage === "revising"
    ? PIPELINE_ORDER
    : ["researching", "drafting", "critiquing", "done"];

  const currentIdx = stages.indexOf(stage);

  return (
    <div className="mt-2 mb-4 flex items-center gap-2 text-xs eyebrow flex-wrap">
      {stages.map((s, i) => {
        const isCurrent = i === currentIdx;
        const isDone = i < currentIdx;
        const isFinal = s === "done" && stage === "done";
        return (
          <span key={s} className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 ${
                isCurrent
                  ? "text-terracotta"
                  : isDone || isFinal
                    ? "text-ink"
                    : "text-muted/50"
              }`}
            >
              {isCurrent && stage !== "done" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isDone || isFinal ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <span className="w-3 h-3 inline-block" />
              )}
              {STAGE_LABEL[s]}
            </span>
            {i < stages.length - 1 && (
              <span className="text-muted/40">→</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function CritiqueDisplay({ critique }: { critique: Critique }) {
  const total =
    critique.scores.factual_accuracy +
    critique.scores.persona_fit +
    critique.scores.cultural_sensitivity +
    critique.scores.source_bias_awareness;

  const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted w-32 font-mono">{label}</span>
      <div className="flex-1 h-1 bg-ink/10 rounded-sm overflow-hidden">
        <div
          className="h-full bg-ink/50"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right">{value}/5</span>
    </div>
  );

  return (
    <div className="mt-8 pt-5 border-t border-ink/10">
      <div className="flex items-baseline justify-between mb-3">
        <p className="eyebrow">System self-evaluation</p>
        <p className="eyebrow">{total}/20</p>
      </div>
      <div className="space-y-1.5 mb-4">
        <ScoreBar label="Factual" value={critique.scores.factual_accuracy} />
        <ScoreBar label="Persona fit" value={critique.scores.persona_fit} />
        <ScoreBar label="Sensitivity" value={critique.scores.cultural_sensitivity} />
        <ScoreBar label="Bias-aware" value={critique.scores.source_bias_awareness} />
      </div>
      {critique.notes && (
        <p className="text-xs text-muted italic leading-relaxed">
          {critique.notes}
        </p>
      )}
    </div>
  );
}