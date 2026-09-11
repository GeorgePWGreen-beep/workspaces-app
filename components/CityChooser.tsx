"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, MapPin, X } from "lucide-react";
import { CITIES, type City } from "@/lib/cities";

export default function CityChooser({ currentCity, onChoose, onCancel }: {
  currentCity: City | null;
  onChoose: (city: City) => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    heading.current?.focus({ preventScroll: true });
    return () => element.close();
  }, []);

  return (
    <dialog ref={dialog} aria-labelledby="city-chooser-title" onCancel={(event) => {
      if (!currentCity) event.preventDefault();
      else onCancel();
    }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[420px] overflow-y-auto rounded-[32px] border border-white bg-[color:var(--hs-bg)] p-6 text-[color:var(--hs-text)] shadow-[0_24px_100px_rgba(20,25,21,0.2)] backdrop:bg-[#17251c]/25 backdrop:backdrop-blur-md sm:p-8">
      <div className="flex items-center justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[color:var(--hs-green-soft)] text-[color:var(--hs-green-deep)]">
          <MapPin aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
        </div>
        {currentCity && <button type="button" onClick={onCancel} aria-label="Close city chooser" className="grid h-11 w-11 place-items-center rounded-full hover:bg-black/5"><X className="h-5 w-5" /></button>}
      </div>
      <h2 ref={heading} tabIndex={-1} id="city-chooser-title" className="mt-6 max-w-[290px] text-[32px] font-extrabold leading-[1.06] tracking-[-0.035em] outline-none">Where are you studying?</h2>
      <p className="mt-3 text-[15px] leading-6 text-[color:var(--hs-text-secondary)]">Find your next study spot.</p>
      <div className="mt-7 space-y-3">
        {CITIES.map((city) => (
          <button key={city} type="button" onClick={() => onChoose(city)} aria-pressed={currentCity === city}
            className="flex min-h-[76px] w-full items-center justify-between rounded-[22px] border border-[color:var(--hs-border)] bg-white px-5 text-left text-[22px] font-bold tracking-[-0.02em] shadow-sm transition-colors hover:border-[color:var(--hs-green)] hover:bg-[color:var(--hs-green-soft)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--hs-green)] active:bg-[color:var(--hs-green-soft)]">
            {city}<ArrowUpRight aria-hidden="true" className="h-5 w-5 text-[color:var(--hs-green)]" />
          </button>
        ))}
      </div>
      <p className="mt-5 text-[12px] leading-5 text-[color:var(--hs-text-tertiary)]">You can change your city from the workspace list.</p>
    </dialog>
  );
}
