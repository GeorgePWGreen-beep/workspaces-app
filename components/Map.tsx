"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Cafe } from "@/types/cafe";
import { getStudyScoreColor } from "@/utils/studyScore";

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

function createMarkerElement(cafe: Cafe) {
  const markerElement = document.createElement("div");
  const markerButton = document.createElement("button");
  const score = document.createElement("span");
  const colour = getStudyScoreColor(cafe.studyScore).stroke;

  markerElement.className = "hs-map-marker";
  markerButton.type = "button";
  markerButton.className = "hs-map-pin";
  markerButton.setAttribute(
    "aria-label",
    `${cafe.name}, Study Score ${cafe.studyScore}`,
  );
  markerButton.setAttribute("aria-pressed", "false");
  markerButton.style.setProperty("--hs-marker-colour", colour);
  markerButton.innerHTML = `
    <svg aria-hidden="true" viewBox="0 0 44 44" focusable="false">
      <path
        d="M22 1.3C12 1.3 4 8.6 4 18.1C4 27.1 14.4 33.7 22 38C29.6 33.7 40 27.1 40 18.1C40 8.6 32 1.3 22 1.3Z"
        fill="#FCFCFA"
        stroke="var(--hs-marker-colour)"
        stroke-width="2.1"
        stroke-linejoin="round"
      />
      <circle
        cx="22"
        cy="41"
        r="2.3"
        fill="var(--hs-marker-colour)"
        stroke="rgba(255,255,255,0.96)"
        stroke-width="1.2"
      />
    </svg>
  `;
  score.className = "hs-map-pin-score";
  score.textContent = String(cafe.studyScore);
  markerButton.append(score);
  markerElement.append(markerButton);

  return { markerElement, markerButton };
}

export default function Map({
  allCafes,
  cafes,
  selectedCafe,
  setSelectedCafe,
}: {
  allCafes: Cafe[];
  cafes: Cafe[];
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

    allCafes.forEach((cafe) => {
      const { markerElement, markerButton } = createMarkerElement(cafe);
      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: "bottom",
      })
        .setLngLat(cafe.coords)
        .addTo(map.current!);

      markerButton.addEventListener("click", () => {
        setSelectedCafe(cafe);
      });

      markers.current[cafe.name] = marker;
    });

    return () => map.current?.remove();
  }, [allCafes, setSelectedCafe]);

  useEffect(() => {
    const visibleCafeNames = new Set(cafes.map((cafe) => cafe.name));

    for (const [cafeName, marker] of Object.entries(markers.current)) {
      marker.getElement().style.display = visibleCafeNames.has(cafeName)
        ? ""
        : "none";
    }
  }, [cafes]);

  useEffect(() => {
    for (const [cafeName, marker] of Object.entries(markers.current)) {
      const isSelected = cafeName === selectedCafe?.name;
      const markerElement = marker.getElement();

      markerElement.classList.toggle("is-selected", isSelected);
      markerElement.style.zIndex = isSelected ? "2" : "1";
      markerElement
        .querySelector("button")
        ?.setAttribute("aria-pressed", String(isSelected));
    }

    if (!selectedCafe || !map.current) return;

    map.current.flyTo({
      center: selectedCafe.coords,
      zoom: 16,
      duration: 2000,
    });
  }, [selectedCafe]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
