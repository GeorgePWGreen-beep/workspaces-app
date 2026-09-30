"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import styles from "./StudyPreferences.module.css";
import PreferenceMotif from "./PreferenceMotif";
import { useStudyPreferences } from "./StudyPreferencesProvider";
import PreferenceFields, { preferenceAction, type PreferenceDraft } from "./onboarding/PreferenceFields";

export default function StudyPreferencesSheet() {
  const state = useStudyPreferences();
  const [draft, setDraft] = useState<PreferenceDraft>(state.preferences ?? { atmosphere_preference: null, session_length: null, priorities: [] });
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const ready = state.status === "available" || state.status === "missing" || state.status === "logged-out";

  useEffect(() => {
    const element = dialog.current!;
    const trigger = document.activeElement;
    element.showModal(); heading.current?.focus();
    return () => { element.close(); if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus(); };
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (state.busy || !draft.atmosphere_preference || !draft.session_length) return;
    await state.save({ atmosphere_preference: draft.atmosphere_preference, session_length: draft.session_length, priorities: draft.priorities });
  }

  return <dialog ref={dialog} aria-labelledby={id} onCancel={event => { event.preventDefault(); state.closeEditor(); }} className={`${styles.sheet} fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[90dvh] w-full max-w-[460px] overflow-hidden rounded-t-[28px] border border-white p-0 text-[color:var(--hs-text)] shadow-[0_16px_64px_rgba(20,25,21,0.16)] backdrop:bg-black/20 backdrop:backdrop-blur-[2px] md:inset-0 md:m-auto md:rounded-[28px]`}>
    <form onSubmit={save} className="flex max-h-[90dvh] flex-col">
      <header className={`${styles.sheetHeader} shrink-0`}>
        <PreferenceMotif className={styles.motif} />
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--hs-green-deep)]">Your study routine</p>
          <h2 id={id} ref={heading} tabIndex={-1} className="text-[25px] font-bold leading-tight tracking-[-0.035em] outline-none">Study preferences</h2>
          <p className="mt-2 text-[13px] leading-5 text-[color:var(--hs-text-secondary)]">Tune Hot Seats to the way you work.</p>
        </div>
        <button type="button" aria-label="Close study preferences" disabled={state.busy} onClick={state.closeEditor} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[color:var(--hs-border)] bg-[color:var(--hs-surface)] focus-visible:outline-2 disabled:opacity-40"><X aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} /></button>
      </header>

      <div className="min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
        {ready && <div className="space-y-8">
          {["Atmosphere", "Session length", "What matters most"].map((label, step) => <section key={label} className={styles.section}>
            <div className="mb-4 flex items-baseline justify-between gap-3"><h3><span aria-hidden="true" className={styles.sectionNumber}>0{step + 1}</span>{label}</h3>{step === 2 && <span aria-live="polite" className="text-[11px] font-medium tabular-nums text-[color:var(--hs-green-deep)]">{draft.priorities.length} of 3 selected</span>}</div>
            {step === 2 && <p className="mb-4 text-[13px] text-[color:var(--hs-text-secondary)]">Choose up to 3</p>}
            <PreferenceFields step={step} draft={draft} onChange={setDraft} busy={state.busy} />
          </section>)}
          <p className="text-xs leading-5 text-[color:var(--hs-text-secondary)]">{state.isGuest ? "Preferences stay on this device until you sign in." : "Your preferences are private. Study Score stays the same for everyone."}</p>
          {state.preferences && <div className="border-t border-[color:var(--hs-border)] pt-4"><button type="button" disabled={state.busy} onClick={() => void state.reset()} className="min-h-11 text-xs text-[color:var(--hs-text-tertiary)] underline-offset-4 hover:underline focus-visible:outline-2 disabled:opacity-40">Reset preferences and remove Match</button></div>}
        </div>}
        {state.status === "loading" && <p role="status" className="py-6 text-sm">Loading preferences...</p>}
        {state.status === "error" && <button type="button" onClick={state.retry} className="min-h-12 text-sm font-semibold text-[color:var(--hs-green-deep)] underline">Retry preferences</button>}
      </div>

      <footer className={`${styles.footer} shrink-0 px-6 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]`}>
        {state.error && <p role="alert" className="mb-3 text-sm leading-5 text-red-800">{state.error}</p>}
        <div className="flex flex-col gap-1">
          <button type="submit" disabled={!ready || state.busy || !draft.atmosphere_preference || !draft.session_length} className={preferenceAction}>{state.busy ? "Saving changes..." : "Save changes"}</button>
          <button type="button" disabled={state.busy} onClick={state.closeEditor} className="min-h-11 rounded-xl px-4 text-[13px] font-medium text-[color:var(--hs-text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40">Cancel</button>
        </div>
      </footer>
    </form>
  </dialog>;
}
