# ChronoPath

> An AI system that walks you through historic Pune as a digital ancestor — adapting the story to who's listening, reasoning about why historic paths mattered, and grounded in a curated corpus of primary sources.

**Live demo:** _(deploy URL goes here)_
**Loom:** _(90-second walkthrough goes here)_

---

## Why this exists

Most "AI tour guide" projects are an LLM call wrapped around Wikipedia. ChronoPath is not that. It is an attempt to build a small but genuinely AI-native system: a multi-agent pipeline with persona-conditioned reasoning, source-bias awareness, and a measurable eval harness.

The thesis: AI is a bridging technology more than a summarizing one. Indian history is full of context that gets flattened in translation — caste geography, peth boundaries, the difference between a colonial and a post-colonial reading of the same event. A system that surfaces those gaps instead of papering over them is more useful than one that produces fluent generic text.

## What it does

Pick a walk. Pick who you are. The system narrates each stop in your voice, with citations to the curated sources it drew from. Between stops, a path-reasoner agent explains why this specific physical route mattered — terrain, political geography, social geography, symbolism — instead of just describing the destinations.

## AI system design

```
USER → walk + persona
   │
   ▼
RESEARCHER AGENT          hybrid BM25 + dense retrieval
   │                       over curated corpus, with
   │                       bias notes preserved
   ▼
STORYTELLER AGENT         persona-conditioned narrative,
   │                       inline citations, analogical
   │                       reasoning across cultures
   ▼
CRITIC AGENT              scores on factual accuracy,
   │                       persona fit, cultural
   │                       sensitivity, source-bias awareness;
   │                       triggers revision if needed
   ▼
PATH-REASONER AGENT       structured JSON output
                           explaining why the route mattered
```

See [DECISIONS.md](./DECISIONS.md) for tradeoffs on each choice.

## Evals

`/evals/report.md` contains a comparison of model performance across 4 personas × 10 prompts × N Claude models, scored on 4 dimensions by a held-out Claude judge (different model than the generator). Cross-family validation (GPT, Gemini) is future work — see `evals/report.md` for full methodology and limitations. _(populated on day 5)_

## Corpus

`/corpus/sources.json` is the project's actual moat. Every entry carries source provenance and explicit bias notes, so the LLM is reasoning over labeled evidence rather than averaging unlabeled documents.

## Stack

Next.js 15 · Anthropic Claude (only) · BM25 retrieval (no embeddings provider) · Leaflet (OpenStreetMap) · TypeScript · Tailwind · deployed on Vercel.

## Limitations (stated honestly)

- One walk, five stops, English only. Extending to multiple cities and Indian languages is the obvious next step.
- Corpus is small (~30 sources). Quality > quantity, but more sources would make the eval more meaningful.
- Eval harness uses LLM-as-judge. Useful for relative model comparison; not a substitute for human evaluation.
- No real GPS — walking simulation is a click-through. A real mobile build with geofencing is a separate project.
- Path-reasoner can over-confidently rationalize; the `uncertainty_notes` field is the mitigation.

## What I'd build next

- Real mobile + GPS + dead-zone offline mode (the original brief)
- Multilingual: same agent pipeline, Marathi and Hindi outputs
- Wider corpus with primary-source ingestion pipeline
- Human-evaluated eval set, not just LLM-as-judge
- Walk authoring tool — let local historians contribute curated walks

## Running locally

```bash
cp .env.example .env.local        # add your API keys
npm install
npm run dev                       # http://localhost:3000
```

## Author note

I authored a similar problem statement as a mentor at an AI event earlier this year — this is my own attempt to actually build it, scoped to one route, AI-first.
