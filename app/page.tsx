import { getWalks } from "@/lib/data";
import { getAllStopsWithSourceCoverage } from "@/lib/route-builder";
import Link from "next/link";
import RouteBuilderForm from "@/components/RouteBuilderForm";

export default function HomePage() {
  const walks = getWalks();
  const availableStops = getAllStopsWithSourceCoverage();

  return (
    <main className="min-h-screen px-6 py-16 md:py-24 max-w-3xl mx-auto">
      <header className="mb-16">
        <p className="eyebrow mb-3">ChronoPath · An experiment in digital ancestry</p>
        <h1 className="serif text-5xl md:text-6xl leading-tight mb-6">
          A walk through old Pune,<br />
          <span className="italic text-sepia">told to you, specifically.</span>
        </h1>
        <p className="narrative max-w-2xl text-lg">
          Most history apps tell every visitor the same thing. ChronoPath adapts the
          story to who's listening — and reasons about why historic paths
          mattered, grounded in primary sources.
        </p>
      </header>

      <RouteBuilderForm stops={availableStops} />

      <section>
        <p className="eyebrow mb-4">Available walks</p>
        <div className="space-y-4">
          {walks.map((w) => (
            <Link
              key={w.id}
              href={`/walk/${w.id}`}
              className="block group border border-ink/15 hover:border-terracotta hover:bg-ink/[0.02] transition-colors p-6 rounded-sm"
            >
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="serif text-3xl group-hover:text-terracotta transition-colors">
                  {w.title}
                </h2>
                <span className="eyebrow">{w.era}</span>
              </div>
              <p className="text-muted text-sm italic mb-3">{w.subtitle}</p>
              <p className="narrative text-base mb-4">{w.description}</p>
              <div className="flex gap-6 eyebrow">
                <span>{w.stops.length} stops</span>
                <span>{w.duration_min} min</span>
                <span>{w.distance_km} km</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <Link
          href="/evals"
          className="inline-block text-sm text-muted hover:text-terracotta border border-ink/15 hover:border-terracotta px-4 py-2 rounded-sm transition-colors"
        >
          → Read the eval report (system self-evaluation across models)
        </Link>
      </section>

      <footer className="mt-24 pt-8 border-t border-ink/10 space-y-3">
  <p className="eyebrow">
    Multi-agent system · researcher → storyteller → critic → path-reasoner ·
    cross-model evals · source-bias aware
  </p>
  <p className="text-xs text-muted italic">
    Source corpus is hand-curated for transparency. Each entry is tagged as
    verified, AI-drafted, or user-added — visible in the README.
  </p>
</footer>
    </main>
  );
}