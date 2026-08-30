"use client";

import { PlugZap, Search, VolumeX, Wifi } from "lucide-react";
import { Cafe } from "@/types/cafe";
import CafeCard from "./CafeCard";

export default function Sidebar({
  cafes,
  selectedCafe,
  setSelectedCafe,
  search,
  onSearchChange,
  greatWifiOnly,
  onToggleGreatWifi,
  quietOnly,
  onToggleQuiet,
  plentySocketsOnly,
  onTogglePlentySockets,
}: {
  cafes: Cafe[];
  selectedCafe: Cafe | null;
  setSelectedCafe: (cafe: Cafe) => void;
  search: string;
  onSearchChange: (value: string) => void;
  greatWifiOnly: boolean;
  onToggleGreatWifi: () => void;
  quietOnly: boolean;
  onToggleQuiet: () => void;
  plentySocketsOnly: boolean;
  onTogglePlentySockets: () => void;
}) {
  return (
    <div className="h-full w-96 overflow-y-auto border-r border-[color:var(--hs-border)] bg-[color:var(--hs-canvas)]">
      <div className="border-b border-[color:var(--hs-border)] p-4">
        <h1 className="text-[32px] font-extrabold leading-none tracking-[-0.06em] text-[color:var(--hs-ink)]">
          HOT SEATS
        </h1>

        <p className="mb-5 mt-2 text-[color:var(--hs-muted)]">
          Find your perfect study spot.
        </p>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--hs-muted)]"
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="Search cafes..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-xl border border-[color:var(--hs-border)] bg-white py-3 pl-10 pr-4 text-[color:var(--hs-ink)] shadow-sm outline-none placeholder:text-[color:var(--hs-muted)] focus:border-[color:var(--hs-sage)] focus:ring-2 focus:ring-[color:var(--hs-sage-soft)]"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onToggleGreatWifi}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hs-sage)] focus-visible:ring-offset-2 ${
              greatWifiOnly
                ? "bg-[color:var(--hs-sage-dark)] text-white shadow-sm"
                : "border border-[color:var(--hs-border)] bg-white text-[color:var(--hs-muted)] hover:border-[color:var(--hs-sage)] hover:bg-[color:var(--hs-sage-soft)]"
            }`}
          >
            <Wifi aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            Great WiFi
          </button>

          <button
            type="button"
            onClick={onToggleQuiet}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hs-sage)] focus-visible:ring-offset-2 ${
              quietOnly
                ? "bg-[color:var(--hs-sage-dark)] text-white shadow-sm"
                : "border border-[color:var(--hs-border)] bg-white text-[color:var(--hs-muted)] hover:border-[color:var(--hs-sage)] hover:bg-[color:var(--hs-sage-soft)]"
            }`}
          >
            <VolumeX aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            Quiet
          </button>

          <button
            type="button"
            onClick={onTogglePlentySockets}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hs-sage)] focus-visible:ring-offset-2 ${
              plentySocketsOnly
                ? "bg-[color:var(--hs-sage-dark)] text-white shadow-sm"
                : "border border-[color:var(--hs-border)] bg-white text-[color:var(--hs-muted)] hover:border-[color:var(--hs-sage)] hover:bg-[color:var(--hs-sage-soft)]"
            }`}
          >
            <PlugZap aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            Sockets
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {cafes.map((cafe) => (
          <CafeCard
            key={cafe.name}
            cafe={cafe}
            selected={selectedCafe?.name === cafe.name}
            onClick={() => setSelectedCafe(cafe)}
          />
        ))}
      </div>
    </div>
  );
}
