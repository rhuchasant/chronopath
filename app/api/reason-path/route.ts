import { anthropic, DEFAULT_MODEL } from "@/lib/agents/client";
import { retrieveSources } from "@/lib/agents/researcher";
import {
  pathReasonerSystemPrompt,
  pathReasonerUserPrompt,
} from "@/lib/agents/path-reasoner";
import { getWalk } from "@/lib/data";
import type { PathReasoning } from "@/lib/types";
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

  const sources = [
    ...(await retrieveSources(fromStopId, "path-reasoning", 3)),
    ...(await retrieveSources(toStopId, "path-reasoning", 3)),
  ];

  if (sources.length === 0) {
    const stub: PathReasoning = {
      from_stop: fromStop.id,
      to_stop: toStop.id,
      primary_reason:
        "[Day 1 placeholder] Path reasoning will be generated once the corpus is curated on Day 2.",
      secondary_reasons: [],
      counterfactual: "",
      confidence: 0,
      uncertainty_notes: "Corpus not yet populated.",
    };
    return Response.json(stub);
  }

  const result = await anthropic().messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 800,
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
