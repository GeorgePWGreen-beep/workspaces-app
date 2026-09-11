"use client";

import { Clock3, PlugZap, SlidersHorizontal, VolumeX, Wifi, type LucideIcon } from "lucide-react";
import type { CafeFilters } from "@/types/filters";
import { countExtendedFilters, isQuickFilterActive, toggleQuickFilter } from "@/utils/filters";

export interface QuickFiltersProps {
  filters: CafeFilters;
  onChange: (next: CafeFilters) => void;
  onOpenFilters: () => void;
}

const QUICK_FILTERS: { key: "quiet" | "wifi" | "sockets" | "independent" | "openNow"; label: string; icon?: LucideIcon }[] = [
  { key: "openNow", label: "Open now", icon: Clock3 },
  { key: "quiet", label: "Quiet", icon: VolumeX },
  { key: "wifi", label: "Great Wi-Fi", icon: Wifi },
  { key: "sockets", label: "Sockets", icon: PlugZap },
  { key: "independent", label: "Independent" },
];

export default function QuickFilters({ filters, onChange, onOpenFilters }: QuickFiltersProps) {
  const activeCount = countExtendedFilters(filters);
  const base = "flex h-11 min-w-0 items-center justify-center gap-1 rounded-2xl border px-1.5 text-[13px] font-semibold leading-none tracking-[-0.015em] shadow-[0_2px_8px_rgba(20,25,21,0.04)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--hs-green)]";
  return (
    <div aria-label="Quick filters" role="group" className="grid grid-cols-3 gap-2">
      {QUICK_FILTERS.map(({ key, label, icon: Icon }) => {
        const active = isQuickFilterActive(filters, key);
        return <button key={key} type="button" aria-pressed={active} onClick={() => onChange(toggleQuickFilter(filters, key))}
          className={`${base} ${active ? "border-[color:var(--hs-green-deep)] bg-[color:var(--hs-green-deep)] text-white" : "border-[color:var(--hs-border)] bg-[#FCFCFA] text-[color:var(--hs-text)] hover:bg-[color:var(--hs-green-soft)]"}`}>
          {Icon && <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />}
          <span className="whitespace-nowrap">{label}</span>
        </button>;
      })}
      <button type="button" onClick={onOpenFilters} aria-label={`Filters${activeCount ? `, ${activeCount} active` : ""}`} aria-haspopup="dialog"
        className={`${base} border-[color:var(--hs-border)] bg-[#FCFCFA] text-[color:var(--hs-text)] hover:bg-[color:var(--hs-green-soft)]`}>
        <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
        <span>Filters</span>
        {activeCount > 0 && <span aria-hidden="true" className="grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--hs-green-deep)] px-0.5 text-[10px] text-white">{activeCount}</span>}
      </button>
    </div>
  );
}
