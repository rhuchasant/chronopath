import type { RetrievedSource, Source } from "@/lib/types";
import { getSourcesForStop } from "@/lib/data";
import { getEmbedding, cosineSimilarity } from "./vector-search";

/**
 * Hybrid Semantic + Lexical Retrieval.
 * 
 * Uses local Transformers.js for embeddings (Semantic) 
 * and theme-overlap scoring (Lexical/Domain).
 */
export async function retrieveSources(
  stopId: string,
  personaDirective: string,
  topK = 6
): Promise<{ sources: RetrievedSource[]; latency_ms: number }> {
  const start = performance.now();
  const all = getSourcesForStop(stopId);
  if (all.length === 0) return { sources: [], latency_ms: 0 };

  // Generate embedding for the persona directive
  const queryEmbedding = await getEmbedding(personaDirective);

  // 1. Calculate scores
  const scored = await Promise.all(all.map(async (s: Source) => {
    const reasons: string[] = [];

    // A. Semantic Score (Cosine Similarity)
    const sourceEmbedding = await getEmbedding(s.content.slice(0, 500)); // Embed first chunk for speed
    const semanticScore = cosineSimilarity(queryEmbedding, sourceEmbedding);
    if (semanticScore > 0.7) reasons.push(`semantic match (${(semanticScore * 100).toFixed(0)}%)`);

    // B. Theme overlap score (Domain Signal)
    const themeFreq = new Map<string, number>();
    for (const src of all) {
      for (const t of src.themes) themeFreq.set(t, (themeFreq.get(t) ?? 0) + 1);
    }
    const themeScore = s.themes.reduce((acc, t) => acc + (themeFreq.get(t) ?? 0), 0) / Math.max(s.themes.length, 1);
    if (themeScore > 1.5) reasons.push("domain: core themes");

    // C. Verification boost
    const trustBoost = s.verification_status === "verified" ? 0.3 : 0;

    return {
      ...s,
      score: (semanticScore * 2) + (themeScore * 0.5) + trustBoost,
      retrieval_reasons: reasons.length ? reasons : ["base: relevance"],
    };
  }));

  // 2. Sort and Diversity
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
    if (!selected.find(sel => sel.id === s.id)) selected.push(s);
  }

  const end = performance.now();
  return { 
    sources: selected, 
    latency_ms: Math.round(end - start) 
  };
}