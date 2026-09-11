"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { FILTER_OPTIONS, type CafeFilters } from "@/types/filters";
import { useLocation, WalkingLocationAction } from "./LocationProvider";

interface FiltersSheetProps {
  filters: CafeFilters;
  onChange: (next: CafeFilters) => void;
  onClear: () => void;
  onClose: () => void;
  resultCount: number;
}

function FilterSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const descriptionId = useId();
  return (
    <fieldset className="min-w-0" aria-describedby={description ? descriptionId : undefined}>
      <legend className="mb-2.5 text-[15px] font-semibold tracking-[-0.015em] text-[color:var(--hs-text)]">
        {title}
      </legend>
      {description && (
        <p id={descriptionId} className="mb-3 text-xs leading-5 text-[color:var(--hs-text-secondary)]">
          {description}
        </p>
      )}
      {children}
    </fieldset>
  );
}

function Choice({
  children,
  selected,
  disabled = false,
  onClick,
}: {
  children: ReactNode;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-11 min-w-0 rounded-2xl border px-2.5 py-2 text-sm font-medium leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hs-green)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? "border-[color:var(--hs-green)] bg-[color:var(--hs-green)] text-white"
          : "border-[color:var(--hs-border)] bg-white text-[color:var(--hs-text)] hover:border-[color:var(--hs-green)]"
      }`}
    >
      {children}
    </button>
  );
}

function MultipleChoices<T extends string>({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: readonly T[];
  selected: readonly T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <FilterSection title={title}>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <Choice
            key={option}
            selected={selected.includes(option)}
            onClick={() => onChange(selected.includes(option)
              ? selected.filter((value) => value !== option)
              : [...selected, option])}
          >
            {option}
          </Choice>
        ))}
      </div>
    </FilterSection>
  );
}

export default function FiltersSheet({ filters, onChange, onClear, onClose, resultCount }: FiltersSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const { coordinates } = useLocation();
  const hasLocation = coordinates !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    titleRef.current?.focus();
    return () => {
      dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
          onClose();
        }
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto h-[min(92dvh,860px)] max-h-[calc(100dvh-env(safe-area-inset-top)-12px)] w-full max-w-[560px] overflow-hidden rounded-t-[32px] border-0 bg-[color:var(--hs-bg)] p-0 text-[color:var(--hs-text)] shadow-2xl backdrop:bg-black/25 md:inset-0 md:my-auto md:rounded-[32px]"
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[color:var(--hs-border)] px-5 pb-4 pt-5 sm:px-6">
          <div className="min-w-0">
            <h2 ref={titleRef} id={titleId} tabIndex={-1} className="text-[26px] font-bold leading-tight tracking-[-0.025em] outline-none">
              Filters
            </h2>
            <p id={descriptionId} className="mt-1.5 text-sm leading-5 text-[color:var(--hs-text-secondary)]">
              Updates map and Nearby as you choose.
            </p>
          </div>
          <button type="button" aria-label="Close filters" onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[color:var(--hs-border)] bg-white text-[color:var(--hs-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hs-green)] focus-visible:ring-offset-2">
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <FilterSection title="Study Score" description="Minimum score. Choose Any to see every score.">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {FILTER_OPTIONS.minStudyScore.map((score) => (
                <Choice key={score} selected={filters.minStudyScore === score} onClick={() => onChange({ ...filters, minStudyScore: score })}>
                  {score === 0 ? "Any" : `${score}+`}
                </Choice>
              ))}
            </div>
          </FilterSection>

          <MultipleChoices title="Price" options={FILTER_OPTIONS.prices} selected={filters.prices} onChange={(prices) => onChange({ ...filters, prices })} />
          <MultipleChoices title="Wi-Fi" options={FILTER_OPTIONS.wifi} selected={filters.wifi} onChange={(wifi) => onChange({ ...filters, wifi })} />
          <MultipleChoices title="Noise" options={FILTER_OPTIONS.noise} selected={filters.noise} onChange={(noise) => onChange({ ...filters, noise })} />
          <MultipleChoices title="Sockets" options={FILTER_OPTIONS.sockets} selected={filters.sockets} onChange={(sockets) => onChange({ ...filters, sockets })} />
          <MultipleChoices title="Busyness" options={FILTER_OPTIONS.busyness} selected={filters.busyness} onChange={(busyness) => onChange({ ...filters, busyness })} />

          <FilterSection title="Cafe type">
            <div className="grid grid-cols-2 gap-2">
              <Choice selected={filters.cafeType === "all"} onClick={() => onChange({ ...filters, cafeType: "all" })}>All</Choice>
              <Choice selected={filters.cafeType === "independent"} onClick={() => onChange({ ...filters, cafeType: "independent" })}>Independent</Choice>
              <div className="col-span-2 grid">
                <Choice selected={filters.cafeType === "non-independent"} onClick={() => onChange({ ...filters, cafeType: "non-independent" })}>Chain / non-independent</Choice>
              </div>
            </div>
          </FilterSection>

          <MultipleChoices title="Coffee quality" options={FILTER_OPTIONS.coffee} selected={filters.coffee} onChange={(coffee) => onChange({ ...filters, coffee })} />
          <MultipleChoices title="Seating comfort" options={FILTER_OPTIONS.seating} selected={filters.seating} onChange={(seating) => onChange({ ...filters, seating })} />

          <FilterSection title="Number of seats" description="Approximate cafe capacity, not available seats.">
            <div className="grid grid-cols-4 gap-2">
              {FILTER_OPTIONS.minSeats.map((seats) => (
                <Choice key={seats ?? "any"} selected={filters.minSeats === seats} onClick={() => onChange({ ...filters, minSeats: seats })}>
                  {seats === null ? "Any" : `${seats}+`}
                </Choice>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Walk time" description={hasLocation ? "Approximate walking time from your location." : filters.maxWalkMinutes !== null ? "Walk-time filter paused. Enable location to apply it." : "Enable location to filter by walk time."}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FILTER_OPTIONS.maxWalkMinutes.map((minutes) => (
                <Choice key={minutes ?? "any"} selected={filters.maxWalkMinutes === minutes} disabled={!hasLocation}
                  onClick={() => onChange({ ...filters, maxWalkMinutes: minutes })}>
                  {minutes === null ? "Any" : `≤${minutes} min`}
                </Choice>
              ))}
            </div>
            {!hasLocation && <WalkingLocationAction />}
          </FilterSection>

          <FilterSection title="Opening hours" description="Open now includes only cafes with confirmed weekly hours.">
            <div className="grid grid-cols-2 gap-2">
              <Choice selected={filters.openNow} onClick={() => onChange({ ...filters, openNow: !filters.openNow })}>Open now</Choice>
            </div>
          </FilterSection>
        </div>

        <footer className="flex shrink-0 items-center gap-3 border-t border-[color:var(--hs-border)] bg-[color:var(--hs-bg)] px-5 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:px-6">
          <button type="button" onClick={onClear}
            className="min-h-12 shrink-0 rounded-2xl px-3 text-sm font-semibold text-[color:var(--hs-text)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hs-green)]">
            Clear all
          </button>
          <button type="button" onClick={onClose}
            className="min-h-12 min-w-0 flex-1 rounded-2xl bg-[color:var(--hs-green)] px-4 py-3 text-[15px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hs-green)] focus-visible:ring-offset-2">
            <span aria-live="polite" aria-atomic="true">Show {resultCount} {resultCount === 1 ? "cafe" : "cafes"}</span>
          </button>
        </footer>
      </div>
    </dialog>
  );
}
