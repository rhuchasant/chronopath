"use client";

import { useEffect, useId } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import type { Stop } from "@/lib/types";

function createNumberedIcon(
  n: number,
  active: boolean,
  isSource: boolean,
  isDestination: boolean
): L.DivIcon {
  let borderColor = "#f5efe0";
  let background = active ? "#a8553f" : "#1a1612";
  let shadow = "0 2px 6px rgba(0,0,0,.25)";
  let scale = active ? "scale(1.2)" : "scale(1)";

  if (isSource) {
    borderColor = "#c9962b"; // Ochre for source
    background = "#c9962b";
    shadow = "0 0 12px rgba(201, 150, 43, 0.6)";
    scale = "scale(1.25)";
  } else if (isDestination) {
    borderColor = "#a8553f"; // Terracotta for destination
    background = "#a8553f";
    shadow = "0 0 12px rgba(168, 85, 63, 0.6)";
    scale = "scale(1.25)";
  }

  return L.divIcon({
    className: "",
    html: `<div style="
      width: 32px; height: 32px;
      border-radius: 50%;
      background: ${background};
      color: #f5efe0;
      font-family: 'Cormorant Garamond', serif;
      font-size: 18px;
      font-weight: 600;
      display: flex; align-items: center; justify-content: center;
      border: 3px solid ${borderColor};
      box-shadow: ${shadow};
      transform: ${scale};
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    ">${n}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function FlyToActive({
  stops,
  activeIndex,
}: {
  stops: Stop[];
  activeIndex: number;
}) {
  const map = useMap();
  useEffect(() => {
    const s = stops[activeIndex];
    if (s) map.flyTo([s.lat, s.lng], 17, { duration: 1.2 });
  }, [activeIndex, stops, map]);
  return null;
}

export default function WalkMap({
  stops,
  activeIndex = -1,
  onSelectStop,
  onSelectStopById,
  sourceId,
  destinationId,
}: {
  stops: Stop[];
  activeIndex?: number;
  onSelectStop?: (i: number) => void;
  onSelectStopById?: (id: string) => void;
  sourceId?: string;
  destinationId?: string;
}) {
  const instanceId = useId();

  const center: [number, number] = [
    stops.reduce((s, p) => s + p.lat, 0) / stops.length,
    stops.reduce((s, p) => s + p.lng, 0) / stops.length,
  ];

  const path = stops.map((s) => [s.lat, s.lng] as [number, number]);

  return (
    <MapContainer
      key={instanceId}
      center={center}
      zoom={16}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {activeIndex !== -1 && (
        <Polyline
          positions={path}
          pathOptions={{
            color: "#a8553f",
            weight: 3,
            opacity: 0.7,
            dashArray: "6 8",
          }}
        />
      )}
      {stops.map((stop, i) => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          icon={createNumberedIcon(
            i + 1,
            i === activeIndex,
            stop.id === sourceId,
            stop.id === destinationId
          )}
          eventHandlers={{
            click: () => {
              if (onSelectStop) onSelectStop(i);
              if (onSelectStopById) onSelectStopById(stop.id);
            },
          }}
        >
          <Popup>
            <div className="font-sans">
              <strong className="block text-base text-ink">{stop.name}</strong>
              <span className="text-xs text-muted italic">{stop.subtitle}</span>
            </div>
          </Popup>
        </Marker>
      ))}
      {activeIndex !== -1 && <FlyToActive stops={stops} activeIndex={activeIndex} />}
    </MapContainer>
  );
}