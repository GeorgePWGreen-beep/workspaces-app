"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { Bookmark, MapPin, Navigation, Share2, X, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { Cafe } from "@/types/cafe";
import { cafeDirections, cafeShareUrl } from "@/utils/cafeActions";
import { useSavedCafes } from "./SavedCafesProvider";

function ActionButton({ icon: Icon, label, primary, active, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; primary?: boolean; active?: boolean }) {
  return <button type="button" {...props}
    className={`flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-sm font-semibold transition-[transform,background-color,border-color] duration-150 active:scale-[0.98] motion-reduce:transform-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hs-sage)] focus-visible:ring-offset-2 ${primary
      ? "border-[color:var(--hs-sage-dark)] bg-[color:var(--hs-sage-dark)] text-white shadow-[0_3px_12px_rgba(20,25,21,0.08)]"
      : active ? "border-[color:var(--hs-border)] bg-[color:var(--hs-green-soft)] text-[color:var(--hs-green)]"
      : "border-[color:var(--hs-border)] bg-[#FCFCFA] text-[color:var(--hs-text)] shadow-[0_3px_12px_rgba(20,25,21,0.04)] hover:border-[color:var(--hs-sage)] hover:bg-[color:var(--hs-sage-soft)]"}`}>
    <Icon aria-hidden="true" className={`h-5 w-5 ${active ? "fill-current" : ""}`} strokeWidth={2} />
    <span>{label}</span>
  </button>;
}

function DirectionsChooser({ cafe, onClose }: { cafe: Cafe; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reduceMotion = useReducedMotion();
  const links = cafeDirections(cafe);
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element?.showModal();
    return () => { element?.close(); if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} aria-labelledby="directions-title" onCancel={onClose}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-4 text-[color:var(--hs-text)] backdrop:bg-black/25 open:flex open:items-end open:justify-center sm:open:items-center">
    <motion.div initial={reduceMotion ? false : { y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.18 }}
      className="w-full max-w-sm rounded-[28px] border border-[color:var(--hs-border)] bg-[color:var(--hs-bg)] p-5 pb-[max(20px,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-3">
        <h2 id="directions-title" className="text-xl font-bold">Directions</h2>
        <button type="button" onClick={onClose} aria-label="Close directions" className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--hs-canvas)]"><X aria-hidden="true" className="h-5 w-5" /></button>
      </div>
      <p className="mb-4 break-words text-sm text-[color:var(--hs-text-secondary)]">Get to {cafe.name}</p>
      {!links.hasCoordinates && <p className="mb-3 text-sm text-[color:var(--hs-text-secondary)]">An exact pin isn&apos;t available. Check the cafe address in Maps before setting off.</p>}
      <div className="space-y-2">
        {([{ name: "Apple Maps", href: links.apple, icon: MapPin }, { name: "Google Maps", href: links.google, icon: Navigation }]).map(({ name, href, icon: Icon }) =>
          <a key={name} href={href} target="_blank" rel="noopener noreferrer" onClick={onClose}
            className="flex min-h-14 items-center gap-3 rounded-2xl border border-[color:var(--hs-border)] bg-white px-4 py-3 font-semibold active:bg-[color:var(--hs-green-soft)]">
            <Icon aria-hidden="true" className="h-5 w-5 text-[color:var(--hs-green)]" />{name}<span className="sr-only"> (opens externally)</span>
          </a>)}
      </div>
    </motion.div>
  </dialog>;
}

export default function CafeActions({ cafe, onSignIn }: { cafe: Cafe; onSignIn: () => void }) {
  const saved = useSavedCafes();
  const active = Boolean(cafe.id && saved.ids.has(cafe.id));
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);
  const [sharing, setSharing] = useState(false);
  const share = async () => {
    if (sharing) return;
    setFeedback(null); setSharing(true);
    const nativeShare = typeof navigator.share === "function";
    try {
      const url = cafeShareUrl(cafe, window.location.origin);
      if (nativeShare) {
        await navigator.share({ title: `${cafe.name} on Hot Seats`, text: `Check out ${cafe.name} on Hot Seats`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setFeedback({ text: "Link copied" });
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        setFeedback({ text: nativeShare ? "Couldn't share this cafe. Please try again." : "Couldn't copy the link. Please try again or copy the address from your browser.", error: true });
      }
    } finally { setSharing(false); }
  };
  return <>
    <div className="grid grid-cols-3 gap-2.5">
      <ActionButton icon={Bookmark} label={active ? "Saved" : "Save"} active={active} aria-pressed={active}
        disabled={saved.loading || saved.loadFailed || Boolean(cafe.id && saved.pending.has(cafe.id))}
        onClick={() => { setFeedback(null); if (!saved.signedIn) onSignIn(); else void saved.toggle(cafe); }} />
      <ActionButton icon={Share2} label="Share" onClick={() => void share()} disabled={sharing} />
      <ActionButton icon={Navigation} label="Directions" primary onClick={() => setDirectionsOpen(true)} />
    </div>
    {feedback && <p role={feedback.error ? "alert" : "status"} className="mt-3 text-center text-sm text-[color:var(--hs-text-secondary)]">{feedback.text}</p>}
    {saved.error && <div role="alert" className="mt-3 text-center text-sm text-[color:var(--hs-text-secondary)]">{saved.error}{saved.loadFailed && <button type="button" onClick={saved.retry} className="ml-2 min-h-11 font-semibold text-[color:var(--hs-green-deep)] underline">Try again</button>}</div>}
    {directionsOpen && <DirectionsChooser cafe={cafe} onClose={() => setDirectionsOpen(false)} />}
  </>;
}
