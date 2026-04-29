import walksData from "@/corpus/walks.json";
import personasData from "@/corpus/personas.json";
import sourcesData from "@/corpus/sources.json";
import type { Walk, Persona, Source } from "@/lib/types";

export function getWalks(): Walk[] {
  return walksData.walks as Walk[];
}

export function getWalk(id: string): Walk | undefined {
  return getWalks().find((w) => w.id === id);
}

export function getPersonas(): Persona[] {
  return personasData.personas as Persona[];
}

export function getPersona(id: string): Persona | undefined {
  return getPersonas().find((p) => p.id === id);
}

export function getSources(): Source[] {
  return (sourcesData.sources ?? []) as Source[];
}

export function getSourcesForStop(stopId: string): Source[] {
  return getSources().filter((s) => s.stop_id === stopId);
}
