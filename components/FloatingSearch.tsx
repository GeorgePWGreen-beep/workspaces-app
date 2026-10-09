"use client";

import { BrandLockup } from "./BrandMark";
import CafeSearch, { type CafeSearchProps } from "./CafeSearch";
import AccountButton from "./AccountButton";
import QuickFilters, { type QuickFiltersProps } from "./QuickFilters";

interface FloatingSearchProps extends QuickFiltersProps, CafeSearchProps {
  onOpenAccount: () => void;
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
}: FloatingSearchProps) {
  return (
    <header data-map-search-controls className="pointer-events-none fixed inset-x-0 top-0 z-50 px-5 pb-3 pt-[max(20px,calc(env(safe-area-inset-top)+12px))] has-[[data-cafe-search-popup]]:z-[55] md:hidden">
      <div className="pointer-events-auto flex items-center justify-between gap-4">
        <h1 className="min-w-0"><BrandLockup /></h1>

        <AccountButton onClick={onOpenAccount} />
      </div>

      <div className="mt-4">
        <CafeSearch mobile search={search} onSearchChange={onSearchChange} cafes={cafes} onSelectCafe={onSelectCafe} />
      </div>

      <div className="pointer-events-auto mt-3">
        <QuickFilters filters={filters} onChange={onChange} onOpenFilters={onOpenFilters} />
      </div>
    </header>
  );
}
