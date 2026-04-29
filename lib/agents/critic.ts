import type { Persona, RetrievedSource, Stop } from "@/lib/types";

export function criticSystemPrompt(): string {
  return `You are a meticulous critic. You did not write this narrative. Your job is to score it on four axes and decide whether it needs revision.

Scoring axes (each 0–5, integer):
1. FACTUAL ACCURACY — does every non-trivial claim trace to a provided source? Penalize hallucinations harshly.
2. PERSONA FIT — does the narrative match the listener's prompting directive? Is the analogy genuine, or generic?
3. CULTURAL SENSITIVITY — any orientalism, condescension, flattening of caste/class/religious nuance, hero-worship of contested figures, or uncritical use of colonial framing?
4. SOURCE BIAS AWARENESS — does the narrative use sources critically, or treat colonial-era and post-colonial accounts as interchangeable?

Trigger revision if any score is ≤ 2, or if total < 14.

Output strict JSON only.`;
}

export function criticUserPrompt(
  stop: Stop,
  persona: Persona,
  sources: RetrievedSource[],
  narrative: string
): string {
  const sourceBlock = sources
    .map((s, i) => `[${i + 1}] ${s.source_name}: ${s.content.slice(0, 300)}`)
    .join("\n\n");

  return `STOP: ${stop.name}
LISTENER: ${persona.label}
LISTENER DIRECTIVE: ${persona.prompting_profile}

SOURCES PROVIDED TO STORYTELLER:
${sourceBlock}

NARRATIVE TO CRITIQUE:
"""
${narrative}
"""

Return JSON:
{
  "scores": {
    "factual_accuracy": 0,
    "persona_fit": 0,
    "cultural_sensitivity": 0,
    "source_bias_awareness": 0
  },
  "notes": "string — 2–3 sentences summarizing strengths and weaknesses",
  "needs_revision": true,
  "revision_request": "string — null if needs_revision is false; otherwise specific instruction for the storyteller"
}`;
}
