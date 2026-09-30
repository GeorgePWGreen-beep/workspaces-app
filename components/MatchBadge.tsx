"use client";
import type { Cafe } from "@/types/cafe";
import { UserRound } from "lucide-react";
import { useStudyPreferences } from "./StudyPreferencesProvider";
export default function MatchBadge({ cafe, details = false }: { cafe: Cafe; details?: boolean }) {
  const { matches } = useStudyPreferences();
  const match = matches.get(cafe);
  if (!match) return null;
  return <div className={details ? "mt-3" : "mt-2"}>
    <span title="Based on your study preferences. Study Score is the same for everyone." className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-[#c9d9be] bg-[#eaf1e2] px-2 py-1 text-[11px] font-semibold leading-4 tabular-nums text-[color:var(--hs-green-deep)]"><UserRound aria-hidden="true" className="h-3 w-3" strokeWidth={1.8} />{match.score}% Match{details ? " for you" : ""}</span>
    {details && <><p className="mt-2 text-[13px] leading-[21px] text-[color:var(--hs-text-secondary)]">{match.reasons.length ? match.reasons.map((reason, index) => <span key={reason} className="inline-block">{reason}{index < match.reasons.length - 1 && <span aria-hidden="true" className="mx-1.5 text-[#a0ada0]">&middot;</span>}</span>) : "This cafe has fewer strengths for your study preferences."}</p><p className="sr-only">Based on your study preferences. Study Score is the same for everyone.</p></>}
  </div>;
}
