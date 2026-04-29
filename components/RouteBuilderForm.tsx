"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Stop } from "@/lib/types";
import { MapPin, Map as MapIcon, ArrowUpDown, Search, Check, ChevronDown, RotateCcw, Navigation } from "lucide-react";

const WalkMap = dynamic(() => import("@/components/WalkMap"), { ssr: false });

interface StopComboboxProps {
  label: string;
  value: string;
  onChange: (id: string) => void;
  stops: Stop[];
  icon: React.ReactNode;
  placeholder?: string;
  isActive?: boolean;
}

function StopCombobox({ label, value, onChange, stops, icon, placeholder, isActive }: StopComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedStop = useMemo(() => stops.find((s) => s.id === value), [stops, value]);

  const filteredStops = useMemo(() => {
    return stops.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [stops, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1" ref={containerRef}>
      <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 w-full h-[48px] px-4 rounded-lg border bg-white transition-all cursor-pointer
          ${isOpen ? "border-terracotta ring-1 ring-terracotta/20 shadow-sm" : "border-ink/10 hover:border-ink/20"}
          ${isActive ? "ring-2 ring-terracotta/40 border-terracotta" : ""}
        `}
      >
        <span className={value ? "text-terracotta" : "text-muted/50"}>{icon}</span>
        <span className={`flex-1 truncate ${!selectedStop ? "text-muted/60 italic text-sm" : "text-ink font-medium"}`}>
          {selectedStop ? selectedStop.name : placeholder || "Select stop..."}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[1000] bg-parchment border border-ink/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-2 border-b border-ink/5 flex items-center gap-2 bg-white/30">
            <Search className="w-4 h-4 text-muted" />
            <input
              autoFocus
              type="text"
              className="w-full bg-transparent border-none focus:ring-0 text-sm py-1"
              placeholder="Search stops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto p-1 custom-scrollbar">
            {filteredStops.length > 0 ? (
              filteredStops.map((stop) => (
                <button
                  key={stop.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(stop.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`
                    flex items-center justify-between w-full px-3 py-2.5 rounded-md text-sm transition-colors text-left
                    ${stop.id === value ? "bg-terracotta/10 text-terracotta" : "hover:bg-ink/5 text-ink/80"}
                  `}
                >
                  <span>{stop.name}</span>
                  {stop.id === value && <Check className="w-4 h-4" />}
                </button>
              ))
            ) : (
              <p className="text-center py-4 text-xs text-muted">No stops found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RouteBuilderForm({ stops }: { stops: Stop[] }) {
  const router = useRouter();
  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.name.localeCompare(b.name)),
    [stops]
  );

  const [sourceId, setSourceId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [selectionStep, setSelectionStep] = useState<"source" | "destination" | "complete">("source");

  const invalid = !sourceId || !destinationId || sourceId === destinationId;

  function onBuild() {
    if (invalid) return;
    const qs = new URLSearchParams({
      source: sourceId,
      destination: destinationId,
    });
    router.push(`/walk/custom?${qs.toString()}`);
  }

  function handleMapClick(id: string) {
    if (selectionStep === "source") {
      setSourceId(id);
      setSelectionStep("destination");
    } else if (selectionStep === "destination") {
      if (id === sourceId) return;
      setDestinationId(id);
      setSelectionStep("complete");
    } else {
      // If already complete, maybe change destination or start over?
      // Let's just set destination for now.
      setDestinationId(id);
    }
  }

  function resetSelection() {
    setSourceId("");
    setDestinationId("");
    setSelectionStep("source");
  }

  const promptText = {
    source: "1. Select starting point on the map",
    destination: "2. Now select your destination",
    complete: "Route ready to build!"
  }[selectionStep];

  return (
    <section className="mb-16">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="serif text-3xl text-ink mb-1">Create Custom Walk</h2>
            <p className="text-sm font-serif italic text-sepia">Interactive route builder</p>
          </div>
          <button
            onClick={resetSelection}
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted hover:text-terracotta transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_350px] gap-6 bg-ink/[0.02] p-4 md:p-6 rounded-2xl border border-ink/5">
          {/* Map Column */}
          <div className="relative h-[400px] lg:h-[500px] rounded-xl overflow-hidden border border-ink/10 shadow-inner">
            <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
              <div className="bg-ink/90 text-parchment px-4 py-2 rounded-full text-sm font-medium shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <Navigation className={`w-4 h-4 text-terracotta ${selectionStep !== 'complete' ? 'animate-pulse' : ''}`} />
                {promptText}
              </div>
            </div>
            
            <WalkMap
              stops={stops}
              onSelectStopById={handleMapClick}
              sourceId={sourceId}
              destinationId={destinationId}
            />
          </div>

          {/* Form Column */}
          <div className="flex flex-col gap-6 justify-center">
            <div className="space-y-4">
              <StopCombobox
                label="From"
                value={sourceId}
                onChange={(id) => {
                  setSourceId(id);
                  if (selectionStep === 'source') setSelectionStep('destination');
                }}
                stops={sortedStops}
                icon={<MapPin className="w-5 h-5" />}
                placeholder="Pick on map or search..."
                isActive={selectionStep === 'source'}
              />

              <div className="flex justify-center -my-2 relative z-10">
                <button
                  onClick={() => {
                    const s = sourceId;
                    setSourceId(destinationId);
                    setDestinationId(s);
                  }}
                  className="p-2 rounded-full border border-ink/10 bg-white hover:border-terracotta hover:text-terracotta transition-all shadow-md active:scale-95 group"
                >
                  <ArrowUpDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>

              <StopCombobox
                label="To"
                value={destinationId}
                onChange={(id) => {
                  setDestinationId(id);
                  setSelectionStep('complete');
                }}
                stops={sortedStops}
                icon={<MapIcon className="w-5 h-5" />}
                placeholder="Pick on map or search..."
                isActive={selectionStep === 'destination'}
              />
            </div>

            <div className="pt-4 border-t border-ink/5">
              <button
                onClick={onBuild}
                disabled={invalid}
                className="w-full h-[56px] bg-terracotta text-parchment rounded-xl font-medium shadow-lg shadow-terracotta/20 hover:bg-terracotta/90 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                Start Journey
                <Navigation className="w-4 h-4 rotate-90" />
              </button>
              
              {sourceId === destinationId && sourceId !== "" && (
                <p className="text-[10px] text-terracotta mt-3 text-center uppercase tracking-tighter font-bold">
                  Source and destination cannot be the same
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
