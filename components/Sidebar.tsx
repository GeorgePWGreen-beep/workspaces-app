"use client";

import { Search } from "lucide-react";
import { Cafe } from "@/types/cafe";
import { useStudyPreferences } from "./StudyPreferencesProvider";
import { rankCafes } from "@/utils/matchV1";
import { useMemo } from "react";
import CafeCard from "./CafeCard";
import QuickFilters, { type QuickFiltersProps } from "./QuickFilters";
import type { City } from "@/lib/cities";
import { WalkingLocationAction } from "./LocationProvider";
import AccountButton from "./AccountButton";

export default function Sidebar({
  city,
  onChangeCity,
  cafes,
  selectedCafe,
  setSelectedCafe,
  search,
  onSearchChange,
  filters,
  onChange,
  onOpenFilters,
  onOpenAccount,
}: {
  city: City;
  onChangeCity: () => void;
  cafes: Cafe[];
  selectedCafe: Cafe | null;
  setSelectedCafe: (cafe: Cafe) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenAccount: () => void;
} & QuickFiltersProps) {
  const { matches, preferences } = useStudyPreferences();
  const nearbyCafes = useMemo(() => rankCafes(cafes, matches), [cafes, matches]);
  return (
    <div className="h-full w-96 overflow-y-auto border-r border-[color:var(--hs-border)] bg-[color:var(--hs-canvas)]">
      <div className="border-b border-[color:var(--hs-border)] p-4">
        <div className="flex items-center justify-between gap-3">
        <h1 className="text-[32px] font-extrabold leading-none tracking-[-0.06em] text-[color:var(--hs-ink)]">
          HOT SEATS
        </h1>
        <AccountButton onClick={onOpenAccount} />
        </div>

        <p className="mb-5 mt-2 text-[color:var(--hs-muted)]">
          Study spots in {city}. <button type="button" onClick={onChangeCity} className="min-h-11 text-sm font-medium text-[color:var(--hs-green-deep)] underline underline-offset-4">Change city</button>
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

        <div className="mt-3">
          <QuickFilters filters={filters} onChange={onChange} onOpenFilters={onOpenFilters} />
        </div>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-xs text-[color:var(--hs-text-secondary)]">{preferences ? "Best match for you" : "Highest Study Score"}</p>
        <WalkingLocationAction />
        {cafes.length === 0 && <p className="text-sm leading-6 text-[color:var(--hs-text-secondary)]">No matching workspaces in {city} yet. Try clearing your filters or choosing another city.</p>}
        {nearbyCafes.map((cafe) => (
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
