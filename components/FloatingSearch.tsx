"use client";

import { Search, UserRound } from "lucide-react";
import QuickFilters, { type QuickFiltersProps } from "./QuickFilters";

interface FloatingSearchProps extends QuickFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function FloatingSearch({
  search,
  onSearchChange,
  filters,
  onChange,
  onOpenFilters,
}: FloatingSearchProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-5 pb-3 pt-[max(20px,calc(env(safe-area-inset-top)+12px))] md:hidden">
      <div className="pointer-events-auto flex items-center justify-between gap-4">
        <h1 className="whitespace-nowrap text-[36px] font-extrabold leading-[0.98] tracking-[-0.04em] text-[color:var(--hs-ink)]">
          HOT SEATS
        </h1>

        <button
          type="button"
          aria-label="Open profile"
          className="hs-glass-strong grid h-12 w-12 shrink-0 place-items-center rounded-full text-[color:var(--hs-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hs-green)] focus-visible:ring-offset-2"
        >
          <UserRound aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
        </button>
      </div>

      <label className="hs-glass-strong pointer-events-auto mt-4 flex h-14 w-full items-center gap-3 rounded-[var(--hs-radius-control)] px-[18px] text-[color:var(--hs-text-secondary)] focus-within:ring-2 focus-within:ring-[color:var(--hs-green)]">
        <Search
          aria-hidden="true"
          className="h-6 w-6 shrink-0"
          strokeWidth={1.9}
        />
        <input
          type="text"
          aria-label="Search cafés and workspaces"
          placeholder="Search cafés and workspaces"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[17px] font-normal tracking-[-0.012em] text-[color:var(--hs-text)] outline-none placeholder:text-[color:var(--hs-text-secondary)]"
        />
      </label>

      <div className="pointer-events-auto mt-3">
        <QuickFilters filters={filters} onChange={onChange} onOpenFilters={onOpenFilters} />
      </div>
    </header>
  );
}
