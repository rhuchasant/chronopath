import { anthropic, DEFAULT_MODEL } from "@/lib/agents/client";
import { retrieveSources } from "@/lib/agents/researcher";
import {
  pathReasonerSystemPrompt,
  pathReasonerUserPrompt,
} from "@/lib/agents/path-reasoner";
import { getWalk } from "@/lib/data";
import type { PathReasoning, RetrievedSource } from "@/lib/types";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { walkId, fromStopId, toStopId } = await req.json();

  const walk = getWalk(walkId);
  const fromStop = walk?.stops.find((s) => s.id === fromStopId);
  const toStop = walk?.stops.find((s) => s.id === toStopId);

  if (!walk || !fromStop || !toStop) {
    return new Response("not found", { status: 404 });
  }

  // Fetch sources separately and tag each with its endpoint
  // so the prompt can clearly say which source describes which stop.
  const fromSources = await retrieveSources(
    fromStopId,
    "path reasoning historical geography",
    3
  );
  const toSources = await retrieveSources(
    toStopId,
    "path reasoning historical geography",
    3
  );

  const labeledFrom: RetrievedSource[] = fromSources.map((s) => ({
    ...s,
    source_name: `[ABOUT ${fromStop.name}] ${s.source_name}`,
  }));
  const labeledTo: RetrievedSource[] = toSources.map((s) => ({
    ...s,
    source_name: `[ABOUT ${toStop.name}] ${s.source_name}`,
  }));

  const sources = [...labeledFrom, ...labeledTo];

  if (sources.length === 0) {
    const stub: PathReasoning = {
      from_stop: fromStop.id,
      to_stop: toStop.id,
      primary_reason: "No sources available for either endpoint.",
      secondary_reasons: [],
      counterfactual: "",
      confidence: 0,
      uncertainty_notes: "Corpus not populated for these stops.",
    };
    return Response.json(stub);
  }

  const result = await anthropic().messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1000,
    system: pathReasonerSystemPrompt(),
    messages: [
      {
        role: "user",
        content: pathReasonerUserPrompt(fromStop, toStop, sources),
      },
    ],
  });

  const text = result.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");

  try {
    const json = JSON.parse(extractJson(text));
    return Response.json({
      from_stop: fromStop.id,
      to_stop: toStop.id,
      ...json,
    } satisfies PathReasoning);
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