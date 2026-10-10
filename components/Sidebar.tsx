"use client";

import { BrandLockup } from "./BrandMark";
import { UsersRound, Bookmark, X } from "lucide-react";
import NearbyIntroduction from "./NearbyIntroduction";
import CafeSearch from "./CafeSearch";
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
  showIntroduction = false,
  onDismissIntroduction,
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
  onOpenFriends,
  onOpenSaved,
}: {
  showIntroduction?: boolean;
  onDismissIntroduction?: () => void;
  city: City;
  onChangeCity: () => void;
  cafes: Cafe[];
  selectedCafe: Cafe | null;
  setSelectedCafe: (cafe: Cafe) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenAccount: () => void;
  onOpenFriends: () => void;
  onOpenSaved: () => void;
} & QuickFiltersProps) {
  const { matches } = useStudyPreferences();
  const nearbyCafes = useMemo(() => rankCafes(cafes, matches), [cafes, matches]);
  return (
    <div className="h-full w-96 overflow-y-auto border-r border-[color:var(--hs-border)] bg-[color:var(--hs-canvas)]">
      <div className="border-b border-[color:var(--hs-border)] p-4">
        <div className="flex items-center justify-between gap-3">
        <h1 className="min-w-0"><BrandLockup /></h1>
        <AccountButton onClick={onOpenAccount} />
        </div>
        <div className="flex items-center gap-3">
        <button type="button" onClick={onOpenFriends} className="mt-3 flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[color:var(--hs-green-deep)] hover:bg-[color:var(--hs-green-soft)]"><UsersRound aria-hidden="true" className="h-4 w-4" />Friends</button>
        <button type="button" onClick={onOpenSaved} className="mt-3 flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[color:var(--hs-green-deep)] hover:bg-[color:var(--hs-green-soft)]"><Bookmark aria-hidden="true" className="h-4 w-4" />Saved</button>
        </div>

        <p className="mb-5 mt-2 text-[color:var(--hs-muted)]">
          Study spots in {city}. <button type="button" onClick={onChangeCity} className="min-h-11 text-sm font-medium text-[color:var(--hs-green-deep)] underline underline-offset-4">Change city</button>
        </p>

        <CafeSearch search={search} onSearchChange={onSearchChange} cafes={cafes} onSelectCafe={setSelectedCafe} />

        <div className="mt-3">
          <QuickFilters filters={filters} onChange={onChange} onOpenFilters={onOpenFilters} />
        </div>
      </div>

      <div className="space-y-3 p-4">
        {showIntroduction && <div className="flex items-start gap-2 rounded-2xl bg-[color:var(--hs-green-soft)] p-3">
          <NearbyIntroduction />
          <button type="button" aria-label="Dismiss introduction" onClick={onDismissIntroduction} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-black/5"><X aria-hidden="true" className="h-4 w-4" /></button>
        </div>}
        <p className="text-xs text-[color:var(--hs-text-secondary)]">{matches.size ? "Best match for you" : "Highest Study Score"}</p>
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
