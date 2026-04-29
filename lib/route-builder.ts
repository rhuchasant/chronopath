import { getSources, getWalks } from "@/lib/data";
import type { Stop, Walk } from "@/lib/types";

function distanceSquared(a: [number, number], b: [number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function projectToSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): { t: number; dist2: number } {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const apx = p[0] - a[0];
  const apy = p[1] - a[1];
  const ab2 = abx * abx + aby * aby || 1;
  const rawT = (apx * abx + apy * aby) / ab2;
  const t = Math.max(0, Math.min(1, rawT));
  const proj: [number, number] = [a[0] + t * abx, a[1] + t * aby];
  return { t, dist2: distanceSquared(p, proj) };
}

export function getAllStopsWithSourceCoverage(): Stop[] {
  const sourceStopIds = new Set(getSources().map((s) => s.stop_id));
  const byId = new Map<string, Stop>();
  for (const walk of getWalks()) {
    for (const stop of walk.stops) {
      if (sourceStopIds.has(stop.id) && !byId.has(stop.id)) {
        byId.set(stop.id, stop);
      }
    }
  }
  return [...byId.values()];
}

export function buildCustomWalk(
  sourceId: string,
  destinationId: string,
  desiredStops = 5
): Walk | null {
  const allStops = getAllStopsWithSourceCoverage();
  const source = allStops.find((s) => s.id === sourceId);
  const destination = allStops.find((s) => s.id === destinationId);
  if (!source || !destination || source.id === destination.id) return null;

  const a: [number, number] = [source.lat, source.lng];
  const b: [number, number] = [destination.lat, destination.lng];

  const middleCandidates = allStops
    .filter((s) => s.id !== source.id && s.id !== destination.id)
    .map((s) => {
      const { t, dist2 } = projectToSegment([s.lat, s.lng], a, b);
      return { stop: s, t, dist2 };
    })
    .sort((x, y) => x.dist2 - y.dist2 || x.t - y.t);

  const middleTarget = Math.max(2, Math.min(3, desiredStops - 2));
  const selectedMiddle = middleCandidates.slice(0, middleTarget).sort((x, y) => x.t - y.t);
  const stops = [source, ...selectedMiddle.map((x) => x.stop), destination];

  const distance = stops.reduce((acc, s, i) => {
    if (i === 0) return 0;
    const prev = stops[i - 1];
    const dLat = s.lat - prev.lat;
    const dLng = s.lng - prev.lng;
    // rough local conversion for city-scale estimation
    return acc + Math.sqrt(dLat * dLat + dLng * dLng) * 111;
  }, 0);

  return {
    id: `custom-${source.id}-to-${destination.id}`,
    title: "Custom Pune Route",
    subtitle: `${source.name} to ${destination.name}`,
    era: "Mixed eras",
    duration_min: Math.round(stops.length * 12),
    distance_km: Number(distance.toFixed(1)),
    description:
      "Generated route based on your selected start and destination, using available curated stops with source coverage.",
    stops,
  };
}
