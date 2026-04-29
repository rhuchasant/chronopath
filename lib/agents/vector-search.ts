import { pipeline } from "@xenova/transformers";

let _extractor: any = null;

export async function getExtractor() {
  if (!_extractor) {
    // Using one of the smallest and most efficient embedding models
    _extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return _extractor;
}

export async function getEmbedding(text: string) {
  const extractor = await getExtractor();
  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(output.data) as number[];
}

export function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mB += vecB[i] * vecB[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  return dotProduct / (mA * mB);
}
