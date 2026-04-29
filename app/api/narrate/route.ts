import { anthropic, DEFAULT_MODEL } from "@/lib/agents/client";
import { retrieveSources } from "@/lib/agents/researcher";
import {
  storytellerSystemPrompt,
  storytellerUserPrompt,
} from "@/lib/agents/storyteller";
import { getPersona, getWalk } from "@/lib/data";
import type { Stop } from "@/lib/types";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { walkId, stopId, personaId, revisionRequest, previousNarrative, stops } =
    await req.json();

  const walk = getWalk(walkId);
  const persona = getPersona(personaId);
  const runtimeStops = ((Array.isArray(stops) ? stops : []) as Stop[]);
  const stop = walk?.stops.find((s) => s.id === stopId) ??
    runtimeStops.find((s) => s.id === stopId);

  if (!persona || !stop) {
    return new Response("not found", { status: 404 });
  }

  const { sources, latency_ms: retrievalLatency } = await retrieveSources(stopId, persona.prompting_profile);

  if (sources.length === 0) {
    const placeholder = `[Day 1 placeholder] You are standing at ${stop.name}. ${stop.subtitle}. The corpus has not been curated yet.`;
    return new Response(streamText(placeholder), {
      headers: { 
        "Content-Type": "text/plain; charset=utf-8",
        "x-latency-retrieval": retrievalLatency.toString()
      },
    });
  }

  const synthesisStart = performance.now();
  const baseUserPrompt = storytellerUserPrompt(stop, persona, sources);

  const userPrompt = revisionRequest
    ? `${baseUserPrompt}

---
PREVIOUS DRAFT (for reference):
"""
${previousNarrative}
"""

REVISION REQUESTED BY CRITIC: ${revisionRequest}

Rewrite the narrative addressing the critic's feedback. Keep the same word count and structure, but fix the specific issues raised.`
    : baseUserPrompt;

  const stream = await anthropic().messages.stream({
    model: DEFAULT_MODEL,
    max_tokens: 700,
    system: storytellerSystemPrompt(),
    messages: [{ role: "user", content: userPrompt }],
    tools: [
      {
        name: "get_historical_weather",
        description: "Get the approximate weather conditions for a specific era and season in Pune to add environmental detail.",
        input_schema: {
          type: "object",
          properties: {
            era: { type: "string", description: "e.g. 18th century, British Raj" },
            season: { type: "string", enum: ["monsoon", "winter", "summer"] }
          },
          required: ["era", "season"]
        }
      }
    ]
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === "message_start") {
            // Send initial telemetry as a hidden JSON chunk or header-equivalent
          }
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        const synthesisEnd = performance.now();
        const synthesisLatency = Math.round(synthesisEnd - synthesisStart);
        // We can't easily add headers after streaming starts, 
        // so we'll just track it for Choice C (Observability UI)
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: { 
      "Content-Type": "text/plain; charset=utf-8",
      "x-latency-retrieval": retrievalLatency.toString()
    },
  });
}

function streamText(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const words = text.split(" ");
      for (const w of words) {
        controller.enqueue(encoder.encode(w + " "));
        await new Promise((r) => setTimeout(r, 30));
      }
      controller.close();
    },
  });
}