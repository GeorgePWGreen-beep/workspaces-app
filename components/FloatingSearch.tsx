"use client";

import {
  PlugZap,
  Search,
  SlidersHorizontal,
  UserRound,
  VolumeX,
  Wifi,
  type LucideIcon,
} from "lucide-react";

interface FloatingSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
  greatWifiOnly: boolean;
  onToggleGreatWifi: () => void;
  quietOnly: boolean;
  onToggleQuiet: () => void;
  plentySocketsOnly: boolean;
  onTogglePlentySockets: () => void;
}

interface FilterPillProps {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
}

function FilterPill({ label, icon: Icon, isActive, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={`hs-glass flex h-12 shrink-0 items-center gap-2 rounded-[var(--hs-radius-control)] px-4 text-[15px] font-medium tracking-[-0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hs-green)] focus-visible:ring-offset-2 ${
        isActive ? "hs-glass-selected" : "text-[color:var(--hs-text)]"
      }`}
    >
      <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.9} />
      {label}
    </button>
  );
}

export default function FloatingSearch({
  search,
  onSearchChange,
  greatWifiOnly,
  onToggleGreatWifi,
  quietOnly,
  onToggleQuiet,
  plentySocketsOnly,
  onTogglePlentySockets,
}: FloatingSearchProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-5 pb-3 pt-[max(20px,calc(env(safe-area-inset-top)+12px))] md:hidden">
      <div className="pointer-events-auto flex items-center justify-between gap-4">
        <h1 className="font-brand whitespace-nowrap text-[38px] font-black leading-[0.98] tracking-[-0.045em] text-[color:var(--hs-ink)]">
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

      <div className="hs-horizontal-scroll pointer-events-auto mt-3 -mr-5 flex gap-2 overflow-x-auto pr-5">
        <FilterPill
          label="Quiet"
          icon={VolumeX}
          isActive={quietOnly}
          onClick={onToggleQuiet}
        />
        <FilterPill
          label="Great Wi-Fi"
          icon={Wifi}
          isActive={greatWifiOnly}
          onClick={onToggleGreatWifi}
        />
        <FilterPill
          label="Sockets"
          icon={PlugZap}
          isActive={plentySocketsOnly}
          onClick={onTogglePlentySockets}
        />
        <button
          type="button"
          aria-label="More filters"
          className="hs-glass flex h-12 shrink-0 items-center gap-2 rounded-[var(--hs-radius-control)] px-4 text-[15px] font-medium tracking-[-0.01em] text-[color:var(--hs-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hs-green)] focus-visible:ring-offset-2"
        >
          <SlidersHorizontal aria-hidden="true" className="h-5 w-5" strokeWidth={1.9} />
          Filters
        </button>
      </div>
    </header>
  );
}
