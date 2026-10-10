"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { Cafe } from "@/types/cafe";
import { normalizeCafeSearch, obviousCafeResult } from "@/utils/cafeSearch";

export interface CafeSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
  cafes: Cafe[];
  onSelectCafe: (cafe: Cafe) => void;
}

export default function CafeSearch({ search, onSearchChange, cafes, onSelectCafe, mobile = false }: CafeSearchProps & { mobile?: boolean }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const expanded = open && normalizeCafeSearch(search).length >= 2;

  useEffect(() => {
    if (!expanded) return;
    const viewport = window.visualViewport;
    const resize = () => {
      if (!popup.current) return;
      const bottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
      popup.current.style.maxHeight = `${Math.max(0, Math.min(mobile ? 208 : 320, bottom - popup.current.getBoundingClientRect().top - 12))}px`;
    };
    resize();
    viewport?.addEventListener("resize", resize);
    viewport?.addEventListener("scroll", resize);
    window.addEventListener("resize", resize);
    return () => {
      viewport?.removeEventListener("resize", resize);
      viewport?.removeEventListener("scroll", resize);
      window.removeEventListener("resize", resize);
    };
  }, [expanded, mobile]);

  const select = (cafe: Cafe) => {
    setOpen(false);
    // Also blur a keyboard-focused result button before opening existing details.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    onSelectCafe(cafe);
  };
  const focusResult = (index: number) => {
    popup.current?.querySelectorAll<HTMLButtonElement>("button")[index]?.focus();
  };

  return <div className="pointer-events-auto relative min-w-0" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }} onKeyDown={event => {
    if (event.key === "Escape") {
      event.preventDefault(); event.stopPropagation(); input.current?.focus(); setOpen(false);
    }
  }}>
    <div className={mobile
      ? "hs-glass-strong flex h-14 w-full items-center gap-3 rounded-[var(--hs-radius-control)] pl-[18px] pr-1.5 focus-within:ring-2 focus-within:ring-[color:var(--hs-green)]"
      : "flex h-12 items-center gap-2 rounded-xl border border-[color:var(--hs-border)] bg-white pl-4 pr-1 shadow-sm focus-within:ring-2 focus-within:ring-[color:var(--hs-sage-soft)]"}>
      <Search aria-hidden="true" className={`${mobile ? "h-6 w-6" : "h-4 w-4"} shrink-0 text-[color:var(--hs-text-secondary)]`} strokeWidth={1.9} />
      <input ref={input} type="text" role="combobox" aria-haspopup="dialog" aria-expanded={expanded}
        aria-controls={expanded ? id : undefined} aria-label="Search cafés and workspaces" autoComplete="off" autoCorrect="off" spellCheck={false}
        enterKeyHint="search" placeholder={mobile ? "Search cafés and workspaces" : "Search cafes..."} value={search}
        onFocus={() => setOpen(true)} onChange={event => { setOpen(true); onSearchChange(event.target.value); }}
        onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault(); setOpen(true);
            requestAnimationFrame(() => focusResult(event.key === "ArrowDown" ? 0 : cafes.length - 1));
          }
          if (event.key === "Enter" && normalizeCafeSearch(search).length >= 2) {
            event.preventDefault();
            const cafe = obviousCafeResult(cafes, search);
            if (cafe) select(cafe); else setOpen(true);
          }
        }}
        className={`min-w-0 flex-1 bg-transparent ${mobile ? "text-[17px] tracking-[-0.012em]" : "text-base"} text-[color:var(--hs-text)] outline-none placeholder:text-[color:var(--hs-text-secondary)]`} />
      {search && <button type="button" aria-label="Clear search" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[color:var(--hs-text-secondary)] hover:bg-[color:var(--hs-green-soft)]"
        onClick={() => { onSearchChange(""); setOpen(false); input.current?.focus(); }}><X aria-hidden="true" className="h-4 w-4" /></button>}
    </div>
    {expanded && <div ref={popup} id={id} role="dialog" aria-label="Cafe suggestions" data-cafe-search-popup
      className="absolute inset-x-0 top-full z-10 mt-2 max-h-80 overflow-y-auto overscroll-contain rounded-2xl border border-[color:var(--hs-border)] bg-[#FCFCFA] p-1.5 shadow-lg">
      <p role="status" className={cafes.length ? "sr-only" : "px-3 py-4 text-sm text-[color:var(--hs-text-secondary)]"}>
        {cafes.length ? `${cafes.length} matching cafes` : "No matching cafes. Try another name or adjust your filters."}
      </p>
      {cafes.map((cafe, index) => <button key={cafe.id ?? cafe.name} type="button"
        onClick={() => select(cafe)} onPointerDown={event => event.preventDefault()}
        onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const next = index + (event.key === "ArrowDown" ? 1 : -1);
            if (next < 0 || next >= cafes.length) input.current?.focus(); else focusResult(next);
          }
        }}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm text-[color:var(--hs-text)] hover:bg-[color:var(--hs-green-soft)] focus:bg-[color:var(--hs-green-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--hs-green)]">
        <span className="min-w-0 break-words font-medium">{cafe.name}</span>
        <span aria-label={`Study Score ${cafe.studyScore}`} className="shrink-0 text-xs tabular-nums text-[color:var(--hs-text-secondary)]">{cafe.studyScore}</span>
      </button>)}
    </div>}
  </div>;
}
