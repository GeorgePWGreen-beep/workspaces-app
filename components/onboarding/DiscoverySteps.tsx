import { ArrowUpRight, Check, MapPin } from "lucide-react";
import StudyScore from "../StudyScore";
import { CITIES, type City } from "@/lib/cities";

export function CityStep({ city, onChange }: { city: City | null; onChange: (city: City) => void }) {
  return <>
    <p className="mt-4 text-[15px] leading-6 text-[color:var(--hs-text-secondary)]">We&apos;ll show you the best study spots around you.</p>
    <fieldset className="mt-8 space-y-3">
      <legend className="sr-only">Choose your city</legend>
      {CITIES.map(value => <label key={value} className={`flex min-h-[110px] cursor-pointer items-center gap-4 rounded-[24px] border p-5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-[color:var(--hs-green)] ${city === value ? "border-[color:var(--hs-green)] bg-[color:var(--hs-green-soft)]" : "border-[color:var(--hs-border)] bg-[color:var(--hs-surface)] hover:border-[color:var(--hs-sage)]"}`}>
        <input type="radio" name="city" className="sr-only" checked={city === value} onChange={() => onChange(value)} />
        <MapPin aria-hidden="true" className="h-6 w-6 shrink-0 text-[color:var(--hs-sage-dark)]" strokeWidth={1.5} />
        <span className="min-w-0 flex-1"><span className="block text-xl font-semibold tracking-tight">{value}</span><span className="mt-1 block text-xs leading-5 text-[color:var(--hs-text-secondary)]">{value === "Exeter" ? "University of Exeter + city centre" : "University + city centre"}</span></span>
        {city === value ? <Check aria-hidden="true" className="h-5 w-5" /> : <ArrowUpRight aria-hidden="true" className="h-5 w-5 text-[color:var(--hs-text-tertiary)]" />}
      </label>)}
    </fieldset>
    <p className="mt-5 text-center text-xs text-[color:var(--hs-text-tertiary)]">More cities coming soon</p>
  </>;
}

export function MatchExample({ complete = false }: { complete?: boolean }) {
  return <div className="my-8 rounded-[26px] border border-[color:var(--hs-border)] bg-[color:var(--hs-surface)] p-6 shadow-[var(--hs-shadow-small)]">
    <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[color:var(--hs-text-tertiary)]">An example of your Hot Seats</p>
    {complete && <p className="mb-4 text-xl font-bold tracking-tight">The Ridge</p>}
    <div className="flex justify-center"><StudyScore score={84} /></div>
    <div className="mt-3 flex items-center justify-between border-t border-[color:var(--hs-border)] pt-4"><span className="text-sm text-[color:var(--hs-text-secondary)]">Your Match</span><span className="rounded-full bg-[color:var(--hs-green-soft)] px-3 py-1.5 text-sm font-semibold text-[color:var(--hs-green-deep)]">93%</span></div>
  </div>;
}
