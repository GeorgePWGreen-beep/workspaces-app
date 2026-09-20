"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useStudyPreferences } from "./StudyPreferencesProvider";
import { PRIORITIES, type StudyPreferences, type Priority } from "@/types/studyPreferences";
const labels: Record<Priority, string> = { wifi: "Wi-Fi", sockets: "Sockets", seating: "Comfort", coffee: "Coffee", space: "Space" };
const button = "min-h-12 rounded-2xl border border-[color:var(--hs-border)] px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40";
export default function StudyPreferencesSheet() {
  const state = useStudyPreferences();
  const [step, setStep] = useState(0);
  const [atmosphere, setAtmosphere] = useState<StudyPreferences["atmosphere_preference"] | null>(state.preferences?.atmosphere_preference ?? null);
  const [session, setSession] = useState<StudyPreferences["session_length"] | null>(state.preferences?.session_length ?? null);
  const [priorities, setPriorities] = useState<Priority[]>(state.preferences?.priorities ?? []);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  useEffect(() => { const el = dialog.current!; const trigger = document.activeElement; el.showModal(); heading.current?.focus(); return () => { el.close(); if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus(); }; }, []);
  useEffect(() => { heading.current?.focus(); }, [step]);
  const ready = state.status === "available" || state.status === "missing";
  function option(value: string, label: string, selected: boolean, onClick: () => void, disabled = false) {
    return <button key={value} type="button" aria-pressed={selected} disabled={state.busy || disabled} onClick={onClick} className={`${button} ${selected ? "border-[color:var(--hs-green)] bg-[color:var(--hs-green-soft)] text-[color:var(--hs-green-deep)]" : "bg-white"}`}>{label}</button>;
  }
  return <dialog ref={dialog} aria-labelledby={id} onCancel={e => { e.preventDefault(); state.closeEditor(); }} className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[90dvh] w-full max-w-[460px] overflow-y-auto rounded-t-[32px] border-0 bg-[color:var(--hs-bg)] p-6 text-[color:var(--hs-text)] shadow-2xl backdrop:bg-black/25 md:inset-0 md:m-auto md:rounded-[32px]">
    <p className="text-xs font-semibold text-[color:var(--hs-green-deep)]">Study preferences {ready && `\u00b7 ${step + 1} of 3`}</p>
    <h2 id={id} ref={heading} tabIndex={-1} className="mt-3 text-[27px] font-bold leading-tight tracking-tight outline-none">{!ready ? "Your study preferences" : ["What atmosphere helps you focus?", "How long do you normally study for?", "What matters most?"][step]}</h2>
    <p className="mt-3 text-sm leading-6 text-[color:var(--hs-text-secondary)]">{step === 2 ? `Choose up to 3 priorities (${priorities.length}/3).` : "Find cafes that suit you. Your answers stay private."}</p>
    {ready && <div className="mt-5 grid gap-3">
      {step === 0 && (["quiet", "balanced", "lively"] as const).map(v => option(v, v[0].toUpperCase() + v.slice(1), atmosphere === v, () => setAtmosphere(v)))}
      {step === 1 && (["short", "medium", "long"] as const).map((v, i) => option(v, ["Under 1 hour", "1\u20132 hours", "2+ hours"][i], session === v, () => setSession(v)))}
      {step === 2 && PRIORITIES.map(v => option(v, labels[v], priorities.includes(v), () => setPriorities(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]), priorities.length === 3 && !priorities.includes(v)))}
    </div>}
    {state.status === "loading" && <p role="status" className="py-6">Loading preferences...</p>}
    {state.error && <p role="alert" className="mt-4 text-sm text-red-800">{state.error}</p>}
    {state.status === "error" && <button className={`${button} mt-4 w-full`} onClick={state.retry}>Retry preferences</button>}
    {ready && <div className="mt-6 flex gap-3">
      {step > 0 && <button className={button} disabled={state.busy} onClick={() => setStep(s => s - 1)}>Back</button>}
      <button className={`${button} flex-1 bg-[color:var(--hs-green)] text-white`} disabled={state.busy || (step === 0 && !atmosphere) || (step === 1 && !session)} onClick={() => { if (step < 2) setStep(s => s + 1); else if (atmosphere && session) void state.save({ atmosphere_preference: atmosphere, session_length: session, priorities }); }}>{state.busy ? "Saving..." : step === 2 ? "Finish" : "Continue"}</button>
    </div>}
    <button className="mt-3 min-h-11 w-full text-sm font-medium underline underline-offset-4 disabled:opacity-40" disabled={state.busy} onClick={state.closeEditor}>{state.preferences ? "Cancel" : "Skip for now"}</button>
    {state.preferences && <button className="min-h-11 w-full text-xs text-[color:var(--hs-text-secondary)] underline disabled:opacity-40" disabled={state.busy} onClick={() => void state.reset()}>Reset preferences and remove Match</button>}
  </dialog>;
}
