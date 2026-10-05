"use client";

import { Bookmark, X } from "lucide-react";
import type { Cafe } from "@/types/cafe";
import CafeCard from "./CafeCard";
import { useSavedCafes } from "./SavedCafesProvider";

export default function SavedPanel({ onSelectCafe, onSignIn, onClose }: { onSelectCafe: (cafe: Cafe) => void; onSignIn: () => void; onClose: () => void }) {
  const saved = useSavedCafes();
  return <div className="px-5 pb-7 pt-1">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[27px] font-bold tracking-[-0.026em]">Saved</h2>
      <button type="button" onClick={onClose} aria-label="Close Saved" className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--hs-canvas)]"><X aria-hidden="true" className="h-5 w-5" /></button>
    </div>
    {saved.error && <div role="alert" className="mb-4 text-sm text-[color:var(--hs-text-secondary)]">{saved.error}{saved.loadFailed && <button type="button" onClick={saved.retry} className="ml-2 min-h-11 font-semibold text-[color:var(--hs-green-deep)] underline">Try again</button>}</div>}
    {saved.loading ? <p role="status" className="py-8 text-center text-sm">Loading your saved cafes...</p>
      : !saved.signedIn ? <div className="py-6 text-center"><Bookmark aria-hidden="true" className="mx-auto mb-4 h-8 w-8 text-[color:var(--hs-green)]" /><p className="text-[color:var(--hs-text-secondary)]">Sign in to keep your favourite study spots together.</p><button type="button" onClick={onSignIn} className="mt-4 min-h-11 rounded-full bg-[color:var(--hs-green)] px-6 font-semibold text-white">Sign in</button></div>
      : !saved.loadFailed && saved.cafes.length === 0 ? <div className="py-6 text-center"><Bookmark aria-hidden="true" className="mx-auto mb-4 h-8 w-8 text-[color:var(--hs-green)]" /><p className="text-[color:var(--hs-text-secondary)]">Save your favourite study spots and they&apos;ll appear here.</p></div>
      : <ul className="space-y-3">{saved.cafes.map(cafe => <li key={cafe.id}>
        <CafeCard cafe={cafe} selected={false} variant="saved" onClick={() => onSelectCafe(cafe)} />
        <button type="button" aria-label={`Remove ${cafe.name} from Saved`} disabled={saved.pending.has(cafe.id!)} onClick={() => void saved.toggle(cafe)} className="ml-auto flex min-h-11 items-center gap-2 px-2 text-xs font-medium text-[color:var(--hs-text-secondary)] active:text-[color:var(--hs-green)] disabled:opacity-50"><Bookmark aria-hidden="true" className="h-4 w-4 fill-current" />Remove from Saved</button>
      </li>)}</ul>}
  </div>;
}
