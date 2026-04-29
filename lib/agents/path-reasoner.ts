import type { RetrievedSource, Stop } from "@/lib/types";

export function pathReasonerSystemPrompt(): string {
  return `You are a historical geographer. Your task is to reason — not narrate — about why a specific physical path between two locations was historically meaningful.

You are given two stops, the historical context, and curated sources. Reason step-by-step over:
- TERRAIN: elevation, river crossings, walls, gates, defensible vs exposed ground
- POLITICAL GEOGRAPHY: who controlled what, and what passing through it signaled
- SOCIAL GEOGRAPHY: caste/class/community zones a path traverses (in old Pune, this matters enormously — peths are not interchangeable)
- SYMBOLIC SIGNIFICANCE: temples, palaces, markets, monuments along the way that gave the path meaning
- COUNTERFACTUAL: if the actor had taken a different route, what would have changed

Output strictly valid JSON, nothing else, matching the requested schema. Be honest about uncertainty — if sources don't support a strong claim, lower the confidence.`;
}

export function pathReasonerUserPrompt(
  fromStop: Stop,
  toStop: Stop,
  sources: RetrievedSource[]
): string {
  const sourceBlock = sources
    .map(
      (s, i) =>
        `[${i + 1}] ${s.source_name}${s.year ? ` (${s.year})` : ""}: ${s.content}`
    )
    .join("\n\n");

  return `FROM: ${fromStop.name} (${fromStop.subtitle})
TO: ${toStop.name} (${toStop.subtitle})

CURATED SOURCES:
${sourceBlock}

Reason about why the path from ${fromStop.name} to ${toStop.name} was historically meaningful.

Return JSON exactly matching this schema, no prose:
{
  "primary_reason": "string — the single most important reason this path mattered",
  "secondary_reasons": ["string", "string", "string"],
  "counterfactual": "string — what would have changed if a different route was taken",
  "confidence": 0.0,
  "uncertainty_notes": "string — what the sources cannot tell us"
}`;
}
