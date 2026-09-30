import geometry from "@/lib/brand-mark.json";

/** The same chair geometry supplies the inline mark, favicon and installed icons. */
export default function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return <svg aria-hidden="true" focusable="false" viewBox={geometry.viewBox} className={`shrink-0 ${className}`}>
    <rect width="64" height="64" rx={geometry.radius} fill="var(--hs-brand-red)" />
    <g fill="none" stroke="var(--hs-brand-on-red)" strokeWidth={geometry.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {geometry.paths.map(path => <path key={path} d={path} />)}
    </g>
  </svg>;
}

export function BrandLockup({ compact = false, wordmarkOnly = false }: { compact?: boolean; wordmarkOnly?: boolean }) {
  return <span className="inline-flex items-center gap-2.5 whitespace-nowrap text-[color:var(--hs-ink)]">
    {!wordmarkOnly && <BrandMark className={compact ? "h-8 w-8" : "h-9 w-9"} />}
    <span className={`font-brand font-extrabold leading-none tracking-[-0.045em] ${compact ? "text-[22px]" : "text-[27px] max-[374px]:text-[25px]"}`}>HOT SEATS</span>
  </span>;
}
