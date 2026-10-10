"use client";
import type { Cafe } from "@/types/cafe";
import { UserRound, X } from "lucide-react";
import { useRef } from "react";
import { useStudyPreferences } from "./StudyPreferencesProvider";
import { useFeatureIntroduction } from "./FeatureIntroductions";
export default function MatchBadge({ cafe, details = false }: { cafe: Cafe; details?: boolean }) {
  const { matches, preferences, isGuest, openEditor } = useStudyPreferences();
  const { ref: introductionRef, visible, dismiss } = useFeatureIntroduction("match");
  const preferenceButton = useRef<HTMLButtonElement>(null);
  const match = matches.get(cafe);
  if (!match && !details) return null;
  return <div ref={introductionRef} className={details ? "mt-5 rounded-2xl border border-[color:var(--hs-border)] bg-[#FCFCFA] p-3.5" : "mt-2"}>
    {match ? <>
    <span title="Based on your study preferences. Study Score is the same for everyone." className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-[#c9d9be] bg-[#eaf1e2] px-2 py-1 text-[11px] font-semibold leading-4 tabular-nums text-[color:var(--hs-green-deep)]"><UserRound aria-hidden="true" className="h-3 w-3" strokeWidth={1.8} />{match.score}% Match{details ? " for you" : ""}</span>
    {details && <><p className="mt-2 text-[13px] leading-[21px] text-[color:var(--hs-text-secondary)]">{match.reasons.length ? match.reasons.map((reason, index) => <span key={reason} className="inline-block">{reason}{index < match.reasons.length - 1 && <span aria-hidden="true" className="mx-1.5 text-[#a0ada0]">&middot;</span>}</span>) : "This cafe has fewer strengths for your study preferences."}</p><p className="sr-only">Based on your study preferences. Study Score is the same for everyone.</p></>}
    </> : <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[color:var(--hs-green-deep)]"><UserRound aria-hidden="true" className="h-4 w-4" />Find your Match</h3>}
    {visible && <section aria-label="About Match" className="hs-introduction mt-2 flex items-start gap-2"
      onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); dismiss(); preferenceButton.current?.focus(); } }}>
      <p className="text-[13px] leading-5 text-[color:var(--hs-text-secondary)]">Your Match helps you find cafés suited to your study preferences, from atmosphere to the facilities you value most.</p>
      <button type="button" aria-label="Dismiss Match introduction" onClick={() => { dismiss(); preferenceButton.current?.focus(); }} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-black/5 focus-visible:outline-2"><X aria-hidden="true" className="h-4 w-4" /></button>
    </section>}
    {details && <>
      {isGuest && <p className="mt-2 text-xs leading-5 text-[color:var(--hs-text-secondary)]">{preferences ? "Preferences saved on this device. Match percentages are available when you sign in." : "Set preferences without an account. Sign in later for personalised Match percentages."}</p>}
      <button ref={preferenceButton} type="button" onClick={() => { dismiss(); openEditor(); }} className="mt-1 min-h-11 text-sm font-semibold text-[color:var(--hs-green-deep)] underline underline-offset-4 focus-visible:outline-2">{preferences ? "Edit study preferences" : "Set study preferences"}</button>
    </>}
  </div>;
}
