"use client";
import type { Cafe } from "@/types/cafe";
import { useStudyPreferences } from "./StudyPreferencesProvider";
export default function MatchBadge({ cafe, details = false }: { cafe: Cafe; details?: boolean }) {
  const { matches } = useStudyPreferences();
  const match = matches.get(cafe);
  if (!match) return null;
  return <div className="mt-2">
    <span className="inline-flex rounded-full bg-[color:var(--hs-green-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--hs-green-deep)]">{match.score}% Match{details ? " for you" : ""}</span>
    {details && <><p className="mt-2 text-sm leading-6 text-[color:var(--hs-text-secondary)]">{match.reasons.length ? match.reasons.join(" \u00b7 ") : "This cafe has fewer strengths for your study preferences."}</p><p className="mt-1 text-xs leading-5 text-[color:var(--hs-text-secondary)]">Based on your study preferences. Study Score is the same for everyone.</p></>}
  </div>;
}
