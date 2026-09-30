"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { BrandLockup } from "../BrandMark";
import styles from "../StudyPreferences.module.css";
import PreferenceMotif from "../PreferenceMotif";
import type { City } from "@/lib/cities";
import { useStudyPreferences } from "../StudyPreferencesProvider";
import WelcomeStep, { primaryAction, secondaryAction } from "./WelcomeStep";
import { CityStep, MatchExample } from "./DiscoverySteps";
import PreferenceFields, { preferenceAction, preferenceHeadings, type PreferenceDraft } from "./PreferenceFields";

type Step = "welcome" | "city" | "intro" | "atmosphere" | "session" | "priorities" | "complete";
const steps: Step[] = ["welcome", "city", "intro", "atmosphere", "session", "priorities", "complete"];
const headings: Record<Exclude<Step, "welcome">, string> = {
  city: "Where are you studying?", intro: "Make Hot Seats yours", atmosphere: preferenceHeadings[0],
  session: preferenceHeadings[1], priorities: preferenceHeadings[2], complete: "You're all set.",
};

export default function OnboardingFlow({ city, onChooseCity, onFinish }: {
  city: City | null; onChooseCity: (city: City) => void; onFinish: () => void;
}) {
  const preferences = useStudyPreferences();
  const [step, setStep] = useState<Step>("welcome");
  const [exploreOnly, setExploreOnly] = useState(false);
  const [draft, setDraft] = useState<PreferenceDraft>(() => preferences.preferences ?? { atmosphere_preference: null, session_length: null, priorities: [] });
  const scroll = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const submitting = useRef(false);
  const preferenceStep = ["atmosphere", "session", "priorities"].indexOf(step);
  const busy = preferences.busy;
  useEffect(() => {
    scroll.current?.scrollTo({ top: 0 });
    scroll.current?.querySelector<HTMLHeadingElement>("h1")?.focus({ preventScroll: true });
  }, [step]);
  function start(explore: boolean) { setExploreOnly(explore); setStep("city"); }
  async function save() {
    if (submitting.current || !draft.atmosphere_preference || !draft.session_length) return;
    submitting.current = true;
    try {
      if (await preferences.save({ atmosphere_preference: draft.atmosphere_preference, session_length: draft.session_length, priorities: draft.priorities })) setStep("complete");
    } finally { submitting.current = false; }
  }
  return <main ref={scroll} aria-label="Welcome to Hot Seats" className={`${preferenceStep >= 0 ? styles.onboarding : ""} h-dvh overflow-y-auto overscroll-contain bg-[color:var(--hs-bg)] px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] text-[color:var(--hs-text)] sm:px-8`}>
    <div className="mx-auto flex min-h-full max-w-[440px] flex-col">
      <header className="mb-7 flex min-h-11 items-center justify-between gap-4 sm:mb-10">
        <BrandLockup compact wordmarkOnly={step === "welcome"} />
        {step !== "welcome" && <button aria-label="Go back" disabled={busy} onClick={() => setStep(steps[steps.indexOf(step) - 1])} className="grid h-11 w-11 place-items-center rounded-full border border-[color:var(--hs-border)] bg-[color:var(--hs-surface)] focus-visible:outline-2 disabled:opacity-40"><ArrowLeft aria-hidden="true" className="h-5 w-5" /></button>}
      </header>
      <motion.div key={step} initial={reducedMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className={`${preferenceStep >= 0 ? styles.stepScreen : "justify-center pb-2 sm:pb-10"} flex flex-1 flex-col`}>
        {step === "welcome" ? <WelcomeStep onStart={() => start(false)} onExplore={() => start(true)} /> : <>
          <div data-step={preferenceStep} className={preferenceStep >= 0 ? styles.questionHeader : undefined}>
          {preferenceStep >= 0 && <PreferenceMotif className={styles.motif} />}
          {preferenceStep >= 0 && <div aria-label={`Study preferences: step ${preferenceStep + 1} of 3`} className="mb-7">
            <div className="mb-3 flex items-center justify-between gap-4"><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--hs-green-deep)]">Study preferences</span><span className="text-[11px] font-medium tabular-nums text-[color:var(--hs-text-tertiary)]">{preferenceStep + 1} of 3</span></div>
            <div aria-hidden="true" className="flex gap-1.5">{[0, 1, 2].map(n => <span key={n} className={`h-[3px] flex-1 rounded-full ${n <= preferenceStep ? "bg-[color:var(--hs-green)]" : "bg-[#e2e7df]"}`} />)}</div>
          </div>}
          {step === "complete" && <span className="mb-6 grid h-14 w-14 place-items-center rounded-full bg-[color:var(--hs-green-soft)] text-[color:var(--hs-green)]"><Check aria-hidden="true" className="h-6 w-6" /></span>}
          <h1 tabIndex={-1} className={`${preferenceStep >= 0 ? "max-w-[370px] text-[30px] leading-[1.13] sm:text-[34px]" : "text-[34px] leading-[1.08] sm:text-[40px]"} font-bold tracking-[-0.035em] text-balance outline-none`}>{headings[step]}</h1>
          </div>
          {step === "city" && <><CityStep city={city} onChange={onChooseCity} /><button disabled={!city} className={`${primaryAction} mt-8`} onClick={() => exploreOnly ? onFinish() : setStep("intro")}>{exploreOnly && city ? `Explore ${city}` : "Continue"}</button></>}
          {step === "intro" && <>
            <p className="mt-5 text-base font-medium">Everyone studies differently.</p>
            <p className="mt-2 text-[15px] leading-6 text-[color:var(--hs-text-secondary)]">Tell us what you care about and we&apos;ll calculate a personalised Match for every café.</p>
            <MatchExample /><button onClick={() => setStep("atmosphere")} className={primaryAction}>Personalise my matches</button><button onClick={onFinish} className={`${secondaryAction} mt-1`}>Skip for now</button>
          </>}
          {preferenceStep >= 0 && <>
            <div className="mb-6 mt-3 flex items-center justify-between gap-3 text-[13px] leading-5 text-[color:var(--hs-text-secondary)]"><p>{step === "priorities" ? "Choose up to 3" : "Find cafés that suit you. Your answers stay private."}</p>{step === "priorities" && <span aria-live="polite" className="shrink-0 text-[11px] font-medium tabular-nums text-[color:var(--hs-green-deep)]">{draft.priorities.length} of 3 selected</span>}</div>
            <PreferenceFields step={preferenceStep} draft={draft} onChange={setDraft} busy={busy} />
            {preferences.error && <p role="alert" className="mt-4 text-sm leading-6 text-red-800">{preferences.error}</p>}
            {preferences.status === "error" && <button onClick={preferences.retry} className={secondaryAction}>Retry preferences</button>}
            <div className={`${styles.stepActions} ${styles.footer}`}>
            <button className={`${preferenceAction} mt-7`} disabled={busy || preferences.status === "loading" || preferences.status === "error" || !draft.atmosphere_preference || (preferenceStep > 0 && !draft.session_length)} onClick={() => step === "priorities" ? void save() : setStep(step === "atmosphere" ? "session" : "priorities")}>{busy ? "Saving preferences…" : step === "priorities" ? "Save preferences" : <>Continue <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} /></>}</button>
            {step === "priorities" && <p className="mt-3 text-center text-xs leading-5 text-[color:var(--hs-text-tertiary)]">{preferences.isGuest ? "No account needed. Your preferences stay on this device." : "Saved privately to your Hot Seats account."}</p>}
            <button disabled={busy} onClick={onFinish} className={`${secondaryAction} mt-1`}>Skip for now</button>
            </div>
          </>}
          {step === "complete" && <>
            <p className="mt-4 text-[15px] leading-6 text-[color:var(--hs-text-secondary)]">{preferences.isGuest ? "Your preferences are saved on this device. Sign in from Account to see your personalised Matches." : "We’ll now rank your study spots around how you like to work."}</p>
            <MatchExample complete /><button onClick={onFinish} className={primaryAction}>Explore {city}</button>
          </>}
        </>}
      </motion.div>
    </div>
  </main>;
}
