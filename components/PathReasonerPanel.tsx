"use client";

import { useState } from "react";
import type { PathReasoning, Stop } from "@/lib/types";
import { ArrowRight, Loader2, ChevronDown, ChevronUp } from "lucide-react";

export default function PathReasonerPanel({
  walkId,
  stops,
  fromStop,
  toStop,
}: {
  walkId: string;
  stops: Stop[];
  fromStop: Stop;
  toStop: Stop;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reasoning, setReasoning] = useState<PathReasoning | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadReasoning() {
    if (reasoning) {
      setOpen((o) => !o);
      return;
    }
    setLoading(true);
    setError(null);
    setOpen(true);
    try {
      const res = await fetch("/api/reason-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walkId,
          fromStopId: fromStop.id,
          toStopId: toStop.id,
          stops,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setReasoning(data);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const confidencePct = reasoning
    ? Math.round((reasoning.confidence ?? 0) * 100)
    : 0;
  const confidenceColor =
    confidencePct >= 70
      ? "bg-terracotta"
      : confidencePct >= 40
        ? "bg-ochre"
        : "bg-muted";

  return (
    <div className="my-6 border-l-2 border-terracotta/40 pl-4">
      <button
        onClick={loadReasoning}
        className="w-full text-left group"
        disabled={loading}
      >
        <p className="eyebrow mb-2 text-terracotta">Why this path?</p>
        <div className="flex items-center gap-2 text-base">
          <span className="serif italic">{fromStop.name}</span>
          <ArrowRight className="w-4 h-4 text-muted" />
          <span className="serif italic">{toStop.name}</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-muted">
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : open ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {reasoning ? (open ? "Hide" : "Show") : "Reason"}
          </span>
        </div>
      </button>

      {open && reasoning && !error && (
        <div className="mt-4 space-y-4 text-sm">
          <div>
            <p className="eyebrow mb-1">Primary reason</p>
            <p className="narrative text-base leading-snug">
              {reasoning.primary_reason}
            </p>
          </div>

          {reasoning.secondary_reasons?.length > 0 && (
            <div>
              <p className="eyebrow mb-1">Also</p>
              <ul className="space-y-1.5">
                {reasoning.secondary_reasons.map((r, i) => (
                  <li
                    key={i}
                    className="text-ink/80 leading-relaxed pl-3 border-l border-ink/15"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reasoning.counterfactual && (
            <div>
              <p className="eyebrow mb-1">If a different route were taken</p>
              <p className="text-ink/80 italic leading-relaxed">
                {reasoning.counterfactual}
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-ink/10">
            <div className="flex items-center justify-between mb-2">
              <p className="eyebrow">Confidence</p>
              <p className="text-xs font-mono">{confidencePct}%</p>
            </div>
            <div className="h-1 bg-ink/10 rounded-sm overflow-hidden">
              <div
                className={`h-full ${confidenceColor} transition-all`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>

          {reasoning.uncertainty_notes && (
            <div>
              <p className="eyebrow mb-1 text-muted">What sources can't tell us</p>
              <p className="text-xs text-muted italic leading-relaxed">
                {reasoning.uncertainty_notes}
              </p>
            </div>
          )}
        </div>
      )}

      {open && error && (
        <p className="mt-3 text-xs text-red-700">
          Could not load reasoning: {error}
        </p>
      )}
    </div>
  );
}