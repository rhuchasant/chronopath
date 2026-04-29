"use client";

import { Activity, Search, ShieldCheck, Zap } from "lucide-react";

interface TraceProps {
  retrievalLatency?: number;
  sourcesFound?: number;
  reasons?: string[];
  isRevising?: boolean;
}

export default function AgentTrace({ retrievalLatency, sourcesFound, reasons, isRevising }: TraceProps) {
  return (
    <div className="p-4 bg-ink text-parchment/70 font-mono text-xs border-t border-parchment/10 space-y-3">
      <div className="flex items-center gap-2 text-parchment">
        <Activity className="w-3 h-3 text-terracotta" />
        <span className="uppercase tracking-widest text-[10px]">Agent Telemetry</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] opacity-50 uppercase">Retriever</span>
          <div className="flex items-center gap-1.5 text-parchment">
            <Search className="w-3 h-3" />
            <span>{retrievalLatency ? `${retrievalLatency}ms` : '---'}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] opacity-50 uppercase">Sources</span>
          <div className="flex items-center gap-1.5 text-parchment">
            <ShieldCheck className="w-3 h-3" />
            <span>{sourcesFound ?? 0} verified</span>
          </div>
        </div>
      </div>

      {reasons && reasons.length > 0 && (
        <div className="pt-2 border-t border-parchment/5">
          <span className="text-[10px] opacity-50 uppercase block mb-1">Retrieval Logic</span>
          <ul className="space-y-1">
            {reasons.slice(0, 2).map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <Zap className="w-2.5 h-2.5 mt-0.5 text-ochre" />
                <span className="leading-tight">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isRevising && (
        <div className="pt-1 flex items-center gap-2 animate-pulse text-ochre">
          <Activity className="w-3 h-3" />
          <span>Critic Agent requesting revision...</span>
        </div>
      )}
    </div>
  );
}
