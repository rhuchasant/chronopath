"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPersonas, getWalk } from "@/lib/data";
import NarrativePanel from "@/components/NarrativePanel";

// Leaflet has SSR issues — load map only on client
const WalkMap = dynamic(() => import("@/components/WalkMap"), { ssr: false });

export default function WalkPage() {
  const params = useParams();
  const walkId = params.walkId as string;
  const walk = getWalk(walkId);
  const personas = getPersonas();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!walk) {
    return (
      <main className="p-12">
        <p>Walk not found.</p>
        <Link href="/" className="underline">Back</Link>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col">
      {/* Top bar */}
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

      {/* Two-pane */}
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
