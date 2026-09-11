"use client";

import type { Cafe } from "@/types/cafe";
import { WEEKDAYS } from "@/types/openingHours";
import { CITY_CONFIG } from "@/lib/cities";
import { getOpeningStatus } from "@/utils/openingHours";
import { useCafeTime } from "./CafeTimeProvider";

export default function OpeningHours({ cafe }: { cafe: Cafe }) {
  const now = useCafeTime();
  const week = cafe.weeklyOpeningHours;
  if (!week) {
    return <div className="mt-4 text-sm text-[color:var(--hs-text-secondary)]">
      <p className="font-medium">Opening times unconfirmed</p>
      {cafe.openingHours && <p className="mt-1 text-xs leading-5">Listed hours: {cafe.openingHours} · days may vary</p>}
    </div>;
  }
  const status = now ? getOpeningStatus(week, now, CITY_CONFIG[cafe.city].timeZone) : null;
  return (
    <details className="mt-4 rounded-2xl bg-white/70 px-3.5 py-3 text-sm" data-sheet-interactive="">
      <summary className="cursor-pointer list-none rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--hs-green)] [&::-webkit-details-marker]:hidden">
        <span className={`block font-semibold leading-5 ${status?.isOpen ? "text-[color:var(--hs-green-deep)]" : "text-[color:var(--hs-text)]"}`}>{status?.label ?? "Opening hours"}</span>
        <span className="mt-1 block text-xs text-[color:var(--hs-text-secondary)]">Weekly opening hours <span aria-hidden="true">⌄</span></span>
      </summary>
      <dl className="mt-3 space-y-2 border-t border-[color:var(--hs-border)] pt-3">
        {WEEKDAYS.map((day) => <div key={day} className="flex justify-between gap-3 text-[13px]">
          <dt className="capitalize text-[color:var(--hs-text-secondary)]">{day}</dt>
          <dd className="text-right font-medium">{week[day] ? `${week[day].open}–${week[day].close}${week[day].close < week[day].open ? " (+1 day)" : ""}` : "Closed"}</dd>
        </div>)}
      </dl>
      <p className="mt-3 text-xs leading-5 text-[color:var(--hs-text-tertiary)]">Local time · holiday hours may vary</p>
    </details>
  );
}
