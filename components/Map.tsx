"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Cafe } from "@/types/cafe";

import { cafes } from "@/data/cafes";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function Map({
  selectedCafe,
  setSelectedCafe,
}: {
  selectedCafe: Cafe | null;
  setSelectedCafe: (cafe: Cafe) => void;
}) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Record<string, mapboxgl.Marker>>({});

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [0.1218, 52.2053],
      zoom: 14,
    });

    cafes.forEach((cafe) => {
      const markerElement = document.createElement("div");

const colour =
  cafe.studyScore >= 90
    ? "#22c55e"
    : cafe.studyScore >= 75
    ? "#f59e0b"
    : "#ef4444";

markerElement.innerHTML = `
<div style="
    background:${colour};
    color:white;
    font-weight:700;
    padding:7px 10px;
    border-radius:999px;
    font-size:14px;
    box-shadow:0 6px 18px rgba(0,0,0,.25);
    border:2px solid white;
    cursor:pointer;
">
    ${cafe.studyScore}
</div>
`;

const marker = new mapboxgl.Marker(markerElement)
  .setLngLat(cafe.coords)
  .addTo(map.current!);

markerElement.addEventListener("click", () => {
  setSelectedCafe(cafe);
});

markers.current[cafe.name] = marker;
        
    });

    return () => map.current?.remove();
  }, []);

  useEffect(() => {
  if (!selectedCafe || !map.current) return;

  map.current.flyTo({
    center: selectedCafe.coords,
    zoom: 16,
    duration: 2000,
  });

  const marker = markers.current[selectedCafe.name];

  if (marker) {
  // Marker exists - nothing else needed for now
}
}, [selectedCafe]);

  return <div ref={mapContainer} className="w-full h-full" />;
}