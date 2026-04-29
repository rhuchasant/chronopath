"use client";

import { useMemo, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getPersonas } from "@/lib/data";
import { buildCustomWalk } from "@/lib/route-builder";
import NarrativePanel from "@/components/NarrativePanel";

const WalkMap = dynamic(() => import("@/components/WalkMap"), { ssr: false });

function CustomWalkContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source") ?? "";
  const destination = searchParams.get("destination") ?? "";
  
  const walk = useMemo(
    () => buildCustomWalk(source, destination, 5),
    [source, destination]
  );
  
  const personas = getPersonas();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!walk) {
    return (
      <main className="p-12">
        <p>Could not build a route for that source/destination pair.</p>
        <Link href="/" className="underline">
          Back
        </Link>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col">
      <header className="px-6 py-3 border-b border-ink/10 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft className="w-4 h-4" /> Walks
        </Link>
        <div className="flex-1">
          <h1 className="serif text-xl leading-none">{walk.title}</h1>
          <p className="eyebrow">{walk.subtitle}</p>
        </div>
        <div className="eyebrow hidden md:block">{walk.era}</div>
      </header>

      <div className="flex-1 grid md:grid-cols-2 overflow-hidden">
        <div className="border-r border-ink/10 min-h-[40vh] md:min-h-0">
          <WalkMap
            stops={walk.stops}
            activeIndex={activeIndex}
            onSelectStop={setActiveIndex}
          />
        </div>
        <div className="overflow-hidden bg-parchment">
          <NarrativePanel
            walkId={walk.id}
            stops={walk.stops}
            personas={personas}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
          />
        </div>
      </div>
    </main>
  );
}

export default function CustomWalkPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-parchment gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
        <p className="eyebrow text-muted">Consulting the archives...</p>
      </div>
    }>
      <CustomWalkContent />
    </Suspense>
  );
}
