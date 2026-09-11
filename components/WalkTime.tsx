"use client";

import { PersonStanding } from "lucide-react";
import { estimateWalkMinutes } from "@/utils/walking";
import { useLocation } from "./LocationProvider";

export default function WalkTime({ coords, compact = false }: { coords: [number, number]; compact?: boolean }) {
  const { coordinates } = useLocation();
  const minutes = estimateWalkMinutes(coordinates, coords);
  if (minutes === null) return null;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap" title="Approximate walk from your location; based on straight-line distance, not a walking route."
      aria-label={`Approximately ${minutes} minutes walk from your location`}>
      <PersonStanding aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
      <span>~{minutes} min{compact ? "" : " walk"}</span>
    </span>
  );
}
