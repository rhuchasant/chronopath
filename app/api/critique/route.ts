import { anthropic, DEFAULT_MODEL } from "@/lib/agents/client";
import { retrieveSources } from "@/lib/agents/researcher";
import {
  criticSystemPrompt,
  criticUserPrompt,
} from "@/lib/agents/critic";
import { getPersona, getWalk } from "@/lib/data";
import type { Critique, Stop } from "@/lib/types";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { walkId, stopId, personaId, narrative, stops } = await req.json();

  const walk = getWalk(walkId);
  const persona = getPersona(personaId);
  const runtimeStops = ((Array.isArray(stops) ? stops : []) as Stop[]);
  const stop = walk?.stops.find((s) => s.id === stopId) ??
    runtimeStops.find((s) => s.id === stopId);

  if (!persona || !stop || !narrative) {
    return new Response("bad request", { status: 400 });
  }

  const sources = await retrieveSources(stopId, persona.prompting_profile);

  if (sources.length === 0) {
    const stub: Critique = {
      scores: {
        factual_accuracy: 0,
        persona_fit: 0,
        cultural_sensitivity: 0,
        source_bias_awareness: 0,
      },
      notes: "No sources available to critique against.",
      needs_revision: false,
    };
    return Response.json(stub);
  }

  const result = await anthropic().messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 600,
    system: criticSystemPrompt(),
    messages: [
      {
        role: "user",
        content: criticUserPrompt(stop, persona, sources, narrative),
      },
    ],
  });

  const text = result.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");

  try {
    const parsed = JSON.parse(extractJson(text)) as Critique;
    return Response.json(parsed);
  } catch {
    return Response.json(
      { error: "json-parse-failed", raw: text },
      { status: 500 }
    );
  }
}

function extractJson(s: string): string {
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  return start >= 0 && end > start ? s.slice(start, end + 1) : s;
}