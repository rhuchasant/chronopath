/**
 * Day 5 task: evaluate generators across personas.
 *
 * Plan (Anthropic-only):
 * 1. Load /evals/prompts.json
 * 2. For each (prompt × generator model), call the storyteller pipeline.
 *    Generators: claude-sonnet-4-5, claude-opus-4-5, claude-haiku-4-5
 * 3. Score each output with the critic (judge) using a *different* Claude
 *    model than the generator (e.g., generate with Sonnet, judge with Haiku;
 *    generate with Haiku, judge with Sonnet). This reduces but does not
 *    eliminate self-preference bias — a limitation we state openly in the
 *    report.
 * 4. Aggregate scores by (model × dimension).
 * 5. Spot-check a sample of N outputs by hand and record agreement with
 *    the LLM judge in /evals/spot-checks/.
 * 6. Write a markdown report to /evals/report.md with comparison table +
 *    qualitative notes + stated limitations.
 *
 * Run with: npm run eval
 */

async function main() {
  console.log("[evals] Day 5 stub. Implement after corpus + agents are stable.");
  console.log(
    "[evals] Will compare: claude-sonnet-4-5, claude-opus-4-5, claude-haiku-4-5"
  );
  console.log("[evals] Cross-model judging: judge != generator within Claude family");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
