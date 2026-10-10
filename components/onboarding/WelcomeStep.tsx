import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, ScanLine, SlidersHorizontal, Wifi } from "lucide-react";

import BrandMark from "../BrandMark";

export const primaryAction = "flex min-h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-[color:var(--hs-green)] px-5 py-4 text-[15px] font-semibold text-white shadow-[var(--hs-shadow-small)] transition-colors hover:bg-[color:var(--hs-green-deep)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--hs-green)] disabled:cursor-default disabled:opacity-40";
export const secondaryAction = "min-h-12 w-full rounded-xl px-3 py-3 text-sm font-medium text-[color:var(--hs-text-secondary)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2";

export default function WelcomeStep({ onStart, onExplore }: { onStart: () => void; onExplore: () => void }) {
  const [scoreExpanded, setScoreExpanded] = useState(false);
  const scoreExplanationId = useId();
  const reducedMotion = useReducedMotion();
  return <>
    <BrandMark className="mb-7 h-16 w-16" />
    <h1 tabIndex={-1} className="max-w-[390px] text-[38px] font-bold leading-[1.06] tracking-[-0.045em] outline-none sm:text-[46px]">Find your perfect place to study.</h1>
    <p className="mt-4 max-w-[390px] text-[15px] leading-6 text-[color:var(--hs-text-secondary)]">Discover cafés and workspaces based on what actually matters when you need to get work done.</p>
    <div className="my-7 space-y-2.5">
      <div className="overflow-hidden rounded-[20px] border border-[color:var(--hs-border)] bg-[color:var(--hs-surface)]">
        <button type="button" aria-expanded={scoreExpanded} aria-controls={scoreExplanationId}
          onClick={() => setScoreExpanded(value => !value)}
          className="flex w-full items-center gap-3.5 rounded-[20px] px-4 py-3.5 text-left focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[color:var(--hs-green)]">
          <ScanLine aria-hidden="true" className="h-5 w-5 shrink-0 text-[color:var(--hs-sage-dark)]" strokeWidth={1.6} />
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Study Scores</span><span className="mt-1 block text-xs leading-5 text-[color:var(--hs-text-secondary)]">See how good each spot is for working.</span></span>
          <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-[color:var(--hs-sage-dark)] transition-transform motion-reduce:transition-none ${scoreExpanded ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence initial={false}>
          {scoreExpanded && <motion.div id={scoreExplanationId} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.18 }}>
            <div className="px-4 pb-4 text-xs leading-5 text-[color:var(--hs-text-secondary)]">
              <p>Every café gets a Study Score out of 100 based on Wi-Fi, noise, seating, sockets, coffee, busyness and available space.</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                {[["85–100", "Excellent"], ["70–84", "Great"], ["60–69", "Good"], ["Below 60", "Fair"]].map(([range, label]) => <div key={range} className="flex justify-between gap-2"><dt className="tabular-nums">{range}</dt><dd className="font-medium text-[color:var(--hs-green-deep)]">{label}</dd></div>)}
              </dl>
            </div>
          </motion.div>}
        </AnimatePresence>
      </div>
      {[
        { icon: SlidersHorizontal, title: "Personalised Match", copy: "Find places that suit how you like to study." },
        { icon: Wifi, title: "Know before you go", copy: "Wi-Fi, sockets, noise, seating and busyness." },
      ].map(({ icon: Icon, title, copy }) => <div key={title} className="flex items-center gap-3.5 rounded-[20px] border border-[color:var(--hs-border)] bg-[color:var(--hs-surface)] px-4 py-3.5">
        <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-[color:var(--hs-sage-dark)]" strokeWidth={1.6} />
        <div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs leading-5 text-[color:var(--hs-text-secondary)]">{copy}</p></div>
      </div>)}
    </div>
    <button onClick={onStart} className={primaryAction}>Get started <ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
    <button onClick={onExplore} className={`${secondaryAction} mt-1`}>Explore without an account</button>
  </>;
}
