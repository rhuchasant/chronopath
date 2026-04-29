/**
 * ChronoPath eval harness.
 * Runs 10 prompts × 2 generator models × cross-model judging.
 * Outputs results.json (raw) and report.md (rendered table).
 * Usage: npm run eval
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import promptsData from "./prompts.json";
import walksData from "../corpus/walks.json";
import personasData from "../corpus/personas.json";
import sourcesData from "../corpus/sources.json";
import {
  storytellerSystemPrompt,
  storytellerUserPrompt,
} from "../lib/agents/storyteller";
import {
  criticSystemPrompt,
  criticUserPrompt,
} from "../lib/agents/critic";
import type {
  Critique,
  Persona,
  RetrievedSource,
  Source,
  Stop,
  Walk,
} from "../lib/types";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY not set");
  process.exit(1);
}

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const GENERATORS = [
  { id: "sonnet", model: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
  { id: "haiku", model: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
];

const judgeFor = (generatorId: string) =>
  generatorId === "sonnet"
    ? { model: "claude-haiku-4-5", label: "Claude Haiku 4.5" }
    : { model: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" };

const walks = (walksData as { walks: Walk[] }).walks;
const personas = (personasData as { personas: Persona[] }).personas;
const allSources = (sourcesData as { sources: Source[] }).sources;

function getStop(stopId: string): Stop {
  for (const w of walks) {
    const s = w.stops.find((st) => st.id === stopId);
    if (s) return s;
  }
  throw new Error("stop not found: " + stopId);
}

function getPersona(id: string): Persona {
  const p = personas.find((x) => x.id === id);
  if (!p) throw new Error("persona not found: " + id);
  return p;
}

function getSourcesForStop(stopId: string): Source[] {
  return allSources.filter((s) => s.stop_id === stopId);
}

function retrieveSources(
  stopId: string,
  personaDirective: string,
  topK = 6
): RetrievedSource[] {
  const all = getSourcesForStop(stopId);
  if (all.length === 0) return [];

  const directiveTokens = new Set(
    personaDirective
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 3)
  );

  const themeFreq = new Map<string, number>();
  for (const s of all) {
    for (const t of s.themes) themeFreq.set(t, (themeFreq.get(t) ?? 0) + 1);
  }

  const scored = all.map((s) => {
    const themeScore =
      s.themes.reduce((acc, t) => acc + (themeFreq.get(t) ?? 0), 0) /
      Math.max(s.themes.length, 1);
    let lex = 0;
    const contentLower = s.content.toLowerCase();
    for (const tok of directiveTokens)
      if (contentLower.includes(tok)) lex += 1;
    const trustBoost = s.verification_status === "verified" ? 0.5 : 0;
    return {
      ...s,
      score: themeScore + lex * 0.3 + trustBoost,
      retrieval_reasons: ["eval-runner"],
    } as RetrievedSource;
  });

  scored.sort((a, b) => b.score - a.score);
  const selected: RetrievedSource[] = [];
  const seenTypes = new Set<string>();
  for (const s of scored) {
    if (selected.length >= topK) break;
    if (!seenTypes.has(s.source_type)) {
      selected.push(s);
      seenTypes.add(s.source_type);
    }
  }
  for (const s of scored) {
    if (selected.length >= topK) break;
    if (!selected.includes(s)) selected.push(s);
  }
  return selected;
}

function extractJson(s: string): string {
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  return start >= 0 && end > start ? s.slice(start, end + 1) : s;
}

async function generate(
  model: string,
  stop: Stop,
  persona: Persona,
  sources: RetrievedSource[]
): Promise<string> {
  const result = await client.messages.create({
    model,
    max_tokens: 700,
    system: storytellerSystemPrompt(),
    messages: [
      { role: "user", content: storytellerUserPrompt(stop, persona, sources) },
    ],
  });
  return result.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
}

async function judge(
  model: string,
  stop: Stop,
  persona: Persona,
  sources: RetrievedSource[],
  narrative: string
): Promise<Critique | null> {
  const result = await client.messages.create({
    model,
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
    return JSON.parse(extractJson(text)) as Critique;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface EvalRow {
  prompt_id: string;
  stop_id: string;
  persona_id: string;
  generator: string;
  judge: string;
  narrative: string;
  critique: Critique | null;
}

async function main() {
  const prompts = (promptsData as {
    prompts: {
      id: string;
      stop_id: string;
      persona_id: string;
      expected_anchors: string[];
    }[];
  }).prompts;

  const rows: EvalRow[] = [];
  const total = prompts.length * GENERATORS.length;
  console.log(
    "[evals] Running " + prompts.length + " prompts × " + GENERATORS.length + " generators = " + total + " narratives, each judged once."
  );

  let n = 0;
  for (const prompt of prompts) {
    const stop = getStop(prompt.stop_id);
    const persona = getPersona(prompt.persona_id);
    const sources = retrieveSources(stop.id, persona.prompting_profile);

    for (const gen of GENERATORS) {
      n += 1;
      const j = judgeFor(gen.id);
      console.log(
        "[evals] " + n + "/" + total + " — " + prompt.id + " | gen: " + gen.label + " | judge: " + j.label
      );

      try {
        const narrative = await generate(gen.model, stop, persona, sources);
        await sleep(500);
        const critique = await judge(j.model, stop, persona, sources, narrative);
        rows.push({
          prompt_id: prompt.id,
          stop_id: prompt.stop_id,
          persona_id: prompt.persona_id,
          generator: gen.label,
          judge: j.label,
          narrative,
          critique,
        });
        await sleep(500);
      } catch (e) {
        console.error("[evals] FAILED " + prompt.id + " × " + gen.label + ":", e);
        rows.push({
          prompt_id: prompt.id,
          stop_id: prompt.stop_id,
          persona_id: prompt.persona_id,
          generator: gen.label,
          judge: j.label,
          narrative: "",
          critique: null,
        });
      }
    }
  }

  const evalsDir = path.join(__dirname);
  fs.writeFileSync(
    path.join(evalsDir, "results.json"),
    JSON.stringify({ generated_at: new Date().toISOString(), rows }, null, 2)
  );

  fs.writeFileSync(path.join(evalsDir, "report.md"), buildReport(rows));
  console.log("[evals] done. results.json and report.md written.");
}

function buildReport(rows: EvalRow[]): string {
  const perGen = new Map<
  string,
  {
    n: number;
    factual: number;
    persona: number;
    sensitivity: number;
    bias: number;
    total: number;
    revisions: number;
  }
>();

  for (const r of rows) {
    if (!r.critique) continue;
    const k = r.generator;
    const a = perGen.get(k) ?? {
      n: 0,
      factual: 0,
      persona: 0,
      sensitivity: 0,
      bias: 0,
      total: 0,
      revisions: 0,
    };
    a.n += 1;
    a.factual += r.critique.scores.factual_accuracy;
    a.persona += r.critique.scores.persona_fit;
    a.sensitivity += r.critique.scores.cultural_sensitivity;
    a.bias += r.critique.scores.source_bias_awareness;
    a.total +=
      r.critique.scores.factual_accuracy +
      r.critique.scores.persona_fit +
      r.critique.scores.cultural_sensitivity +
      r.critique.scores.source_bias_awareness;
    if (r.critique.needs_revision) a.revisions += 1;
    perGen.set(k, a);
  }

  const fmt = (sum: number, n: number) => (n > 0 ? (sum / n).toFixed(2) : "-");

  const parts: string[] = [];
  parts.push("# ChronoPath Eval Report");
  parts.push("");
  parts.push("_Generated: " + new Date().toISOString() + "_");
  parts.push("");
  parts.push("## Methodology");
  parts.push("");
  parts.push("10 prompts × 2 generator models, scored on 4 dimensions by a held-out Claude judge (different model than the generator):");
  parts.push("");
  parts.push("1. **Factual accuracy** — every claim traces to a provided source");
  parts.push("2. **Persona fit** — narrative matches the persona's prompting directive");
  parts.push("3. **Cultural sensitivity** — no orientalism, condescension, or flattening of caste/class/religious nuance");
  parts.push("4. **Source-bias awareness** — uses sources critically, not interchangeably");
  parts.push("");
  parts.push("**Cross-model judging within Claude family.** Sonnet generations are judged by Haiku; Haiku generations are judged by Sonnet. The judge model is never the same as the generator. This reduces — but does not eliminate — self-preference bias, since both judges share the same model family.");
  parts.push("");
  parts.push("## Results");
  parts.push("");
  parts.push("| Generator | n | Factual | Persona | Sensitivity | Bias-aware | Total /20 | Revisions triggered |");
  parts.push("|---|---|---|---|---|---|---|---|");

  for (const [gen, a] of perGen) {
    parts.push(
      "| " + gen + " | " + a.n + " | " + fmt(a.factual, a.n) + " | " + fmt(a.persona, a.n) + " | " + fmt(a.sensitivity, a.n) + " | " + fmt(a.bias, a.n) + " | " + fmt(a.total, a.n) + " | " + a.revisions + "/" + a.n + " |"
    );
  }

  parts.push("");
  parts.push("## Per-prompt detail");
  parts.push("");
  parts.push("| Prompt | Stop | Persona | Generator | Total |");
  parts.push("|---|---|---|---|---|");

  for (const r of rows) {
    const total = r.critique
      ? r.critique.scores.factual_accuracy +
        r.critique.scores.persona_fit +
        r.critique.scores.cultural_sensitivity +
        r.critique.scores.source_bias_awareness
      : "—";
    parts.push(
      "| " + r.prompt_id + " | " + r.stop_id + " | " + r.persona_id + " | " + r.generator + " | " + total + "/20 |"
    );
  }

  parts.push("");
  parts.push("## Limitations (stated openly)");
  parts.push("");
  parts.push("- LLM-as-judge is useful for *relative* model ranking, not absolute scoring.");
  parts.push("- All judges are Claude-family models. Cross-family validation (GPT, Gemini as third judges) is future work.");
  parts.push("- Judges inherit family-level biases — particularly toward verbose, hedged outputs.");
  parts.push("- Corpus is small (~14 sources, 5 stops). Absolute scores are not stable across runs; relative ordering is.");
  parts.push("- Each prompt judged once. Production-grade evals would judge each output multiple times and average to reduce variance.");
  parts.push("- The eval set itself was authored alongside the system; an independently authored eval set would be a stronger benchmark.");
  parts.push("");
  parts.push("## How to read this");
  parts.push("");
  parts.push("The score table is the headline. The per-prompt detail surfaces specific cases where models diverge sharply.");
  parts.push("");
  parts.push("## Reproducing");
  parts.push("");
  parts.push("Run `npm run eval` to regenerate this report.");
  parts.push("");

  return parts.join("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});