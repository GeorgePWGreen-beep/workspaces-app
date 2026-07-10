"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Cafe } from "@/types/cafe";

import { cafes } from "@/data/cafes";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function Map({
  selectedCafe,
}: {
  selectedCafe: Cafe | null;
}) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-3.5339, 50.7184],
      zoom: 13,
    });

    cafes.forEach((cafe) => {
      new mapboxgl.Marker({
        color:
          cafe.wifi === "Great WiFi"
            ? "green"
            : cafe.wifi === "Good WiFi"
            ? "orange"
            : "red",
      })
        .setLngLat(cafe.coords)
        .setPopup(
          new mapboxgl.Popup().setHTML(`
            <div style="font-family:sans-serif;padding:5px;">
              <h3 style="margin:0;font-size:16px;">${cafe.name}</h3>
              <p style="margin:4px 0;font-size:14px;">${cafe.wifi}</p>
            </div>
          `)
        )
        .addTo(map.current!);
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
}, [selectedCafe]);

  return <div ref={mapContainer} className="w-full h-full" />;
}