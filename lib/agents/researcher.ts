import type { RetrievedSource, Source } from "@/lib/types";
import { getSourcesForStop } from "@/lib/data";

/**
 * Theme-overlap retrieval with diversity preservation.
 *
 * For a small curated corpus (~15-30 sources), this beats setting up BM25
 * or embeddings infrastructure. We compute scores from:
 *   1. Theme overlap with the stop's themes (the primary signal)
 *   2. Lexical hits in the persona directive against source content
 *   3. A diversity bonus to preserve at least one source per source_type
 *      so the storyteller sees primary, colonial, and post-colonial
 *      perspectives where they exist.
 *
 * "Future work: hybrid BM25 + dense retrieval with Voyage embeddings"
 * goes in DECISIONS.md and the README — the upgrade path is clear when
 * the corpus grows past ~100 sources.
 */
export async function retrieveSources(
  stopId: string,
  personaDirective: string,
  topK = 6
): Promise<RetrievedSource[]> {
  const all = getSourcesForStop(stopId);
  if (all.length === 0) return [];

  // Tokenise persona directive once (lowercase, alpha tokens >3 chars)
  const directiveTokens = new Set(
    personaDirective
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 3)
  );

  // Primary signal: theme co-occurrence within the stop's source set.
  // Themes that appear across multiple sources are core to the stop;
  // themes unique to one source are still useful but specialised.
  const themeFreq = new Map<string, number>();
  for (const s of all) {
    for (const t of s.themes) themeFreq.set(t, (themeFreq.get(t) ?? 0) + 1);
  }

  const scored = all.map((s: Source) => {
    const reasons: string[] = [];

    // 1. Theme weight — sources covering core themes get higher base score
    const themeScore = s.themes.reduce(
      (acc, t) => acc + (themeFreq.get(t) ?? 0),
      0
    ) / Math.max(s.themes.length, 1);
    if (themeScore > 1.5) reasons.push(`covers core themes (${s.themes.slice(0, 2).join(", ")})`);

    // 2. Lexical hits against persona directive
    let lex = 0;
    const contentLower = s.content.toLowerCase();
    for (const tok of directiveTokens) {
      if (contentLower.includes(tok)) lex += 1;
    }
    if (lex > 0) reasons.push(`matches persona directive (${lex} hits)`);

    // 3. Verified sources get a small trust boost
    const trustBoost = s.verification_status === "verified" ? 0.5 : 0;
    if (trustBoost > 0) reasons.push("verification: verified");

    return {
      ...s,
      score: themeScore + lex * 0.3 + trustBoost,
      retrieval_reasons: reasons.length ? reasons : ["base: stop_id match"],
    };
  });

  // Sort by score desc
  scored.sort((a, b) => b.score - a.score);

  // Diversity preservation: ensure each source_type present in the
  // corpus appears at least once in the retrieved set when possible.
  const selected: RetrievedSource[] = [];
  const seenTypes = new Set<string>();
  for (const s of scored) {
    if (selected.length >= topK) break;
    if (!seenTypes.has(s.source_type)) {
      selected.push(s);
      seenTypes.add(s.source_type);
    }
  }
  // Fill remaining slots from the highest-scored leftovers
  for (const s of scored) {
    if (selected.length >= topK) break;
    if (!selected.includes(s)) selected.push(s);
  }

  return selected;
}