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

function createNumberedIcon(n: number, active: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 32px; height: 32px;
      border-radius: 50%;
      background: ${active ? "#a8553f" : "#1a1612"};
      color: #f5efe0;
      font-family: 'Cormorant Garamond', serif;
      font-size: 18px;
      font-weight: 600;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #f5efe0;
      box-shadow: 0 2px 6px rgba(0,0,0,.25);
      ${active ? "transform: scale(1.2);" : ""}
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
  activeIndex,
  onSelectStop,
}: {
  stops: Stop[];
  activeIndex: number;
  onSelectStop: (i: number) => void;
}) {
  // Force a fresh map instance per mount — works around the
  // "Map container is already initialized" bug in React 18 Strict Mode.
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
      <Polyline
        positions={path}
        pathOptions={{
          color: "#a8553f",
          weight: 3,
          opacity: 0.7,
          dashArray: "6 8",
        }}
      />
      {stops.map((stop, i) => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          icon={createNumberedIcon(i + 1, i === activeIndex)}
          eventHandlers={{ click: () => onSelectStop(i) }}
        >
          <Popup>
            <strong>{stop.name}</strong>
            <br />
            {stop.subtitle}
          </Popup>
        </Marker>
      ))}
      <FlyToActive stops={stops} activeIndex={activeIndex} />
    </MapContainer>
  );
}