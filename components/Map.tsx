"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Cafe } from "@/types/cafe";
import { getStudyScoreColor } from "@/utils/studyScore";

import { cafes } from "@/data/cafes";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const quietMapPalette = {
  background: "#f8f7f2",
  land: "#f7f6f0",
  park: "#e8f0e4",
  water: "#d5e6e8",
  road: "#e4e2dc",
  boundary: "#ece9e3",
  building: "#f1efe8",
  label: "#697069",
  poiLabel: "#898f88",
};

function setPaintProperty(
  map: mapboxgl.Map,
  layerId: string,
  property: string,
  value: string | number,
) {
  try {
    map.setPaintProperty(layerId, property as never, value as never);
  } catch {
    // Some layers do not expose every paint property. They retain their
    // existing value rather than making style softening brittle.
  }
}

function softenMapStyle(map: mapboxgl.Map) {
  for (const layer of map.getStyle().layers ?? []) {
    const sourceLayer = layer["source-layer"] ?? "";
    const layerName = `${layer.id} ${sourceLayer}`.toLowerCase();
    const isWater = /water|river|canal|lake/.test(layerName);
    const isPark = /park|landuse|landcover|grass|wood|nature/.test(layerName);
    const isRoad = /road|bridge|tunnel|rail|motorway|street/.test(layerName);
    const isPoi = /poi|transit|airport|aeroway|housenum/.test(layerName);

    if (layer.type === "background") {
      setPaintProperty(map, layer.id, "background-color", quietMapPalette.background);
      continue;
    }

    if (layer.type === "fill") {
      const color = isWater
        ? quietMapPalette.water
        : isPark
          ? quietMapPalette.park
          : /building/.test(layerName)
            ? quietMapPalette.building
            : quietMapPalette.land;

      setPaintProperty(map, layer.id, "fill-color", color);
      setPaintProperty(map, layer.id, "fill-opacity", isWater ? 0.8 : 0.89);
      continue;
    }

    if (layer.type === "line") {
      setPaintProperty(
        map,
        layer.id,
        "line-color",
        isRoad ? quietMapPalette.road : quietMapPalette.boundary,
      );
      setPaintProperty(map, layer.id, "line-opacity", isRoad ? 0.64 : 0.48);
      continue;
    }

    if (layer.type === "fill-extrusion") {
      setPaintProperty(map, layer.id, "fill-extrusion-color", quietMapPalette.building);
      setPaintProperty(map, layer.id, "fill-extrusion-opacity", 0.34);
      continue;
    }

    if (layer.type === "symbol") {
      setPaintProperty(
        map,
        layer.id,
        "text-color",
        isPoi ? quietMapPalette.poiLabel : quietMapPalette.label,
      );
      setPaintProperty(map, layer.id, "text-opacity", isPoi ? 0.45 : 0.7);
      setPaintProperty(map, layer.id, "icon-opacity", isPoi ? 0.36 : 0.54);
    }
  }
}

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

    map.current.once("style.load", () => {
      if (map.current) softenMapStyle(map.current);
    });

    cafes.forEach((cafe) => {
      const markerElement = document.createElement("div");

const colour = getStudyScoreColor(cafe.studyScore).stroke;

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
