"use client";

import { PersonStanding } from "lucide-react";
import { estimateWalkMinutes } from "@/utils/walking";
import { useLocation } from "./LocationProvider";

export default function WalkTime({ coords, compact = false }: { coords: [number, number]; compact?: boolean }) {
  const { coordinates } = useLocation();
  const minutes = estimateWalkMinutes(coordinates, coords);
  if (minutes === null) return null;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap ${compact ? "h-6 rounded-full border border-[color:var(--hs-border)] bg-[#F7F8F6] px-2 text-[12px] font-medium text-[color:var(--hs-text-secondary)] shadow-[0_1px_2px_rgba(20,25,21,0.035)]" : ""}`} title="Approximate walk from your location; based on straight-line distance, not a walking route."
      aria-label={`Approximately ${minutes} minutes walk from your location`}>
      <PersonStanding aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
      <span>{compact ? `${minutes} min` : `~${minutes} min walk`}</span>
    </span>
  );
}
