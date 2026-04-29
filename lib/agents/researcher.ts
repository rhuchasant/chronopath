import type { RetrievedSource, Source } from "@/lib/types";
import { getSourcesForStop } from "@/lib/data";

/**
 * DAY 3 TASK: replace this naive implementation with BM25 retrieval.
 *
 * Plan (Anthropic-only stack — no embeddings provider):
 * 1. Build a BM25 index over `content + themes + source_name` using
 *    wink-bm25-text-search.
 * 2. Construct the query from (stop themes + persona prompting_profile).
 * 3. Boost sources whose `themes` intersect the stop's themes (+0.5 score).
 * 4. Always preserve at least one source per `source_type` if available
 *    so the storyteller sees diverse perspectives (primary, colonial,
 *    post-colonial, oral).
 * 5. Cap at top 6 sources. More than that overflows the prompt without
 *    helping quality.
 *
 * Why BM25-only and not hybrid:
 * - 30-source corpus doesn't need dense retrieval to work well
 * - Anthropic doesn't offer embeddings; avoiding a second provider
 *   keeps the stack simple and the bill in one place
 * - "Future work: hybrid retrieval with Voyage embeddings" gets a
 *   line in the README. Honest, scoped.
 */
export async function retrieveSources(
  stopId: string,
  personaDirective: string,
  topK = 6
): Promise<RetrievedSource[]> {
  const all = getSourcesForStop(stopId);

  // Naive day-1 fallback: return all sources as if equally relevant.
  // Replace on day 3.
  return all.slice(0, topK).map((s: Source, i: number) => ({
    ...s,
    score: 1 - i * 0.05,
    retrieval_reasons: ["naive: stop_id match (day 1 stub)"],
  }));
}
