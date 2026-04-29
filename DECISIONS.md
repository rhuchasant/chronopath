# ChronoPath: Architecture Decisions

A running log of non-trivial design choices and their tradeoffs. Read top-down — earliest decisions at the top.

---

## D1 · Multi-agent pipeline over single-prompt

**Decision:** Four distinct agents — Researcher, Storyteller, Critic, Path-Reasoner — instead of one large prompt that does everything.

**Why:** Single-prompt systems hide failure modes. With separate agents we can:
- Evaluate the storyteller without the retrieval being a confound
- Run the critic on outputs from different generator models in our eval harness
- Replace any single agent (e.g. swap retrieval to a real vector DB) without touching others
- Visibly show the pipeline in the UI, which is legibly impressive in the demo

**Cost:** More LLM calls per stop. Mitigated by caching narratives keyed on (stop_id, persona_id, model).

---

## D2 · BM25 retrieval over hybrid (BM25 + dense)

**Decision:** Pure BM25 lexical retrieval, no embeddings.

**Why:** Anthropic does not offer a first-party embeddings model — using dense retrieval would mean adding a second provider (Voyage, OpenAI) to the stack. For a corpus of ~30 hand-curated sources, BM25 alone gives genuinely good retrieval. The marginal gain from adding dense retrieval is not worth the second API key, second bill, and added integration surface area at this scale.

**Cost:** Some thematic queries that would benefit from semantic similarity may surface less ideal sources. Mitigated by carefully tagging each source with `themes` and constructing the BM25 query from (stop themes + persona directive).

**Future work:** Hybrid retrieval with Voyage embeddings is a clean upgrade path once the corpus grows past ~100 sources.

---

## D3 · Source-bias notes as first-class metadata

**Decision:** Every source in the corpus carries an explicit `bias_notes` field. Bias notes are surfaced to the storyteller and critic.

**Why:** Most RAG systems treat retrieved documents as interchangeable facts. For Indian colonial history this is actively dangerous — the 1885 Bombay Presidency Gazetteer and a 2010 post-colonial history will give materially different accounts of the same event, and uncritically blending them produces worse history than either alone. Making bias visible to the LLM lets it weigh sources rather than averaging them.

**Cost:** Manual curation effort per source. This is the actual moat of the project — there is no shortcut.

---

## D4 · Persona-conditioned generation, not just translation

**Decision:** Personas have a `prompting_profile` field that instructs the storyteller on *what kind of analogical work* to do, not just tone or vocabulary.

**Why:** "Explain like I'm five" is not the same as cultural bridging. An Italian visitor benefits most from a *structural* analogy ("the Peshwa-British relationship maps onto Medici-Habsburg dynamics") — the work is finding the right mapping, not simplifying the language. Tone-only personas produce condescending output.

---

## D5 · Cross-Claude-model judging for evals

**Decision:** Use a held-out Claude model (different from the generator) as the eval judge, rather than Claude-as-its-own-judge or a separate-family model.

**Why:** Hand-scoring 40 narratives across 4 personas is intractable in this timeline. LLM-as-judge is well-studied and reasonable for *relative* model comparisons. Using a *different model within Claude family* reduces self-preference bias compared to same-model judging, while keeping the stack on a single provider.

**Caveats (stated openly in README and `evals/report.md`):**
- Absolute scores are not meaningful, only ranking is
- All judges share Claude's family-level biases (cross-family validation is future work)
- Judge inherits biases toward verbose, hedged outputs
- We mitigate with hand spot-checks on a sample, recorded in `/evals/spot-checks/`

---

## D6 · Curated corpus over live scraping

**Decision:** Sources are pre-curated into `corpus/sources.json` rather than scraped at request time.

**Why:** Live scraping at request time is fragile (sites change), slow (adds seconds to every narrative), legally murky (some sources don't allow scraping), and pedagogically wrong (the system would only be as good as the first Wikipedia paragraph). Pre-curation is the project. Scraping happens *once*, with attribution and bias annotation by hand.

---

## D7 · Path-reasoner returns structured JSON, not prose

**Decision:** The path-reasoner agent outputs a JSON object with named fields including `confidence` and `uncertainty_notes`.

**Why:** The reasoning is the unique IP. Forcing structured output makes it (a) renderable in a consistent UI element, (b) machine-readable for evals, (c) honest about uncertainty rather than smoothing over gaps with confident prose.

---

<!-- Add new decisions here as they come up. Every architectural fork gets a D-entry. -->
