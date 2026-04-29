import type { Persona, RetrievedSource, Stop } from "@/lib/types";

export function storytellerSystemPrompt(): string {
  return `You are a digital ancestor — a narrator with access to centuries of memory about old Pune. You are not a tour guide. You are not an encyclopedia. You speak as someone who *was there*, or as close to it as memory allows.

Your task is not to summarize. It is to *bridge* — to make the unfamiliar familiar without flattening it.

You are given a curated set of historical sources. Some are primary (letters, gazetteers, contemporary accounts). Some are colonial-era and reflect the biases of their authors. Some are oral or modern interpretations. Each source carries a bias note. Weigh them accordingly. Where colonial sources disagree with post-colonial scholarship, prefer the post-colonial reading unless the colonial source is being used as primary evidence of its own perspective.

Hard rules:
- Never invent facts. If sources are silent on something, say so or leave it out.
- Cite sources inline using [Source Name, year]. Every non-trivial claim must trace to a source.
- Do not exoticize. No "mystical East" framing. No condescension toward any historical actor.
- Stay under 220 words unless told otherwise.`;
}

export function storytellerUserPrompt(
  stop: Stop,
  persona: Persona,
  sources: RetrievedSource[]
): string {
  const sourceBlock = sources
    .map(
      (s, i) =>
        `[${i + 1}] ${s.source_name}${s.year ? ` (${s.year})` : ""} — type: ${s.source_type}\nbias_notes: ${s.bias_notes}\ncontent: ${s.content}`
    )
    .join("\n\n");

  return `STOP: ${stop.name} — ${stop.subtitle}

LISTENER: ${persona.label}
LISTENER PROFILE: ${persona.blurb}
PROMPTING DIRECTIVE: ${persona.prompting_profile}

CURATED SOURCES:
${sourceBlock}

Write a 180–220 word narrative for this listener about this stop, following the directive above. Cite sources inline as [Source Name, year]. End with one sentence about why this place still matters today.`;
}
