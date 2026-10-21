"use client";

import { BrandLockup } from "./BrandMark";
import { ChevronDown, MapPin } from "lucide-react";
import type { City } from "@/lib/cities";
import CafeSearch, { type CafeSearchProps } from "./CafeSearch";
import AccountButton from "./AccountButton";
import QuickFilters, { type QuickFiltersProps } from "./QuickFilters";

interface FloatingSearchProps extends QuickFiltersProps, CafeSearchProps {
  onOpenAccount: () => void;
  city: City;
  onChangeCity: () => void;
}

export default function FloatingSearch({
  search,
  onSearchChange,
  cafes,
  onSelectCafe,
  filters,
  onChange,
  onOpenFilters,
  onOpenAccount,
  city,
  onChangeCity,
}: FloatingSearchProps) {
  return (
    <header data-map-search-controls className="pointer-events-none fixed inset-x-0 top-0 z-50 px-5 pb-3 pt-[max(20px,calc(env(safe-area-inset-top)+12px))] has-[[data-cafe-search-popup]]:z-[55] md:hidden">
      <div className="pointer-events-auto flex items-center justify-between gap-4">
        <h1 className="min-w-0"><BrandLockup /></h1>

        <AccountButton onClick={onOpenAccount} />
      </div>

      <div className="relative mt-4 flex items-center gap-2">
        <button type="button" onClick={onChangeCity} aria-label={`Change city, currently ${city}`} aria-haspopup="dialog"
          className="hs-glass-strong pointer-events-auto flex h-14 shrink-0 items-center gap-1 whitespace-nowrap rounded-[var(--hs-radius-control)] px-2.5 text-sm font-medium text-[color:var(--hs-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--hs-green)]">
          <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-[color:var(--hs-green)]" strokeWidth={1.9} />
          <span>{city}</span>
          <ChevronDown aria-hidden="true" className="h-3 w-3 shrink-0 text-[color:var(--hs-text-secondary)]" />
        </button>
        <CafeSearch mobile search={search} onSearchChange={onSearchChange} cafes={cafes} onSelectCafe={onSelectCafe} />
      </div>

      <div className="pointer-events-auto mt-3">
        <QuickFilters filters={filters} onChange={onChange} onOpenFilters={onOpenFilters} />
      </div>
    </header>
  );
}
