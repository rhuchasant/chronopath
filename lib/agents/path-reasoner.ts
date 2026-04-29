import type { RetrievedSource, Stop } from "@/lib/types";

export function pathReasonerSystemPrompt(): string {
  return `You are a historical geographer reasoning about why a specific physical path between two named locations was historically meaningful.

CRITICAL: You will be given two stops by name (FROM and TO). You must reason about the path between *those two specific places*. Sources are labeled with [ABOUT <stop name>] to make endpoint attribution unambiguous. Do not substitute different locations even if the sources mention them.

Reason step-by-step over:
- TERRAIN: elevation, river crossings, walls, gates, defensible vs exposed ground
- POLITICAL GEOGRAPHY: who controlled what, and what passing through it signaled
- SOCIAL GEOGRAPHY: caste/class/community zones a path traverses (in old Pune, peths are not interchangeable — Kasba Peth, Shaniwar Peth, etc. carried distinct identities)
- SYMBOLIC SIGNIFICANCE: what the journey from FROM to TO meant given who they were and what they represented
- COUNTERFACTUAL: what would have changed if the actor had taken a different route

Honesty rules — these matter:
- The sources describe the endpoints, not the path. Be honest when you are inferring from the endpoints versus citing the path directly.
- If the sources do not support a strong claim about the path, say so and lower the confidence.
- Note explicitly in 'uncertainty_notes' what the sources cannot tell us.
- Do NOT invent specific events, names, or dates not present in the sources.
- Do NOT substitute reasoning about a different pair of locations.

Output strictly valid JSON, nothing else.`;
}

export function pathReasonerUserPrompt(
  fromStop: Stop,
  toStop: Stop,
  sources: RetrievedSource[]
): string {
  const sourceBlock = sources
    .map(
      (s, i) =>
        `[${i + 1}] ${s.source_name}${s.year ? ` (${s.year})` : ""} — type: ${s.source_type}\nbias_notes: ${s.bias_notes}\ncontent: ${s.content}`
    )
    .join("\n\n");

  return `FROM: ${fromStop.name} — ${fromStop.subtitle}
TO: ${toStop.name} — ${toStop.subtitle}

Reason about the path FROM ${fromStop.name} TO ${toStop.name}. These are the only two endpoints. Do not substitute others.

Sources are tagged [ABOUT <stop>] to indicate which endpoint they describe:

${sourceBlock}

Return JSON exactly matching this schema, no prose, no markdown:
{
  "primary_reason": "string — the single most important reason the path FROM ${fromStop.name} TO ${toStop.name} mattered, in one sentence. Name BOTH endpoints in the sentence.",
  "secondary_reasons": ["string", "string", "string"],
  "counterfactual": "string — what would have changed if a different route between THESE TWO endpoints was taken",
  "confidence": 0.0,
  "uncertainty_notes": "string — what the sources cannot tell us about THIS specific path"
}

Set confidence between 0 and 1. Use 0.7+ only when sources directly support the reasoning. For purely inferential reasoning from endpoint context, 0.4–0.6 is appropriate.`;
}