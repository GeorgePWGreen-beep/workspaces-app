"use client";

import { Clock3, Coffee, History, Trophy, UsersRound, X, Zap } from "lucide-react";

const features = [
  { title: "Study Sessions", description: "Record your focus sessions and earn points.", icon: Clock3 },
  { title: "Studying Now", description: "See friends who choose to share their caf\u00e9.", icon: Coffee },
  { title: "Leaderboards", description: "Compete with friends using Study Points.", icon: Trophy },
  { title: "Recent Activity", description: "Keep up with your study circle.", icon: History },
];

/** Informational placeholder only. Keep the panel boundary for future LIVE work. */
export default function LivePanel({ onClose }: { onClose: () => void }) {
  return <div className="px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-1 text-[color:var(--hs-text)]">
    <header className="flex items-start justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-[28px] font-bold leading-tight tracking-[-.035em]"><Zap aria-hidden="true" className="h-5 w-5 text-[color:var(--hs-green)]" strokeWidth={1.8} />LIVE</h2>
        <p className="mt-1 text-sm text-[color:var(--hs-text-secondary)]">A new way to study together.</p>
        <p className="mt-2 text-[11px] font-medium text-[color:var(--hs-text-tertiary)]">Coming soon</p>
      </div>
      <button type="button" onClick={onClose} aria-label="Close LIVE" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[color:var(--hs-text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--hs-green)]"><X aria-hidden="true" className="h-5 w-5" /></button>
    </header>

    <section aria-labelledby="live-introduction" className="px-1 py-7 text-center">
      <UsersRound aria-hidden="true" className="mx-auto mb-4 h-8 w-8 text-[color:var(--hs-green)]" strokeWidth={1.5} />
      <h3 id="live-introduction" className="text-[23px] font-semibold leading-tight tracking-[-.025em]">Study together. Go further.</h3>
      <p className="mx-auto mt-3 max-w-[300px] text-sm leading-6 text-[color:var(--hs-text-secondary)]">Track your study sessions, earn points and see how your friends are getting on.</p>
    </section>

    <ul aria-label="Upcoming LIVE features" className="divide-y divide-[color:var(--hs-border)] overflow-hidden rounded-[22px] bg-white px-4 shadow-[0_2px_12px_rgba(20,25,21,0.025)]">
      {features.map(({ title, description, icon: Icon }) => <li key={title} className="flex items-start gap-3 py-4">
        <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--hs-green)]" strokeWidth={1.7} />
        <div className="min-w-0"><h4 className="text-sm font-semibold">{title}</h4><p className="mt-1 text-xs leading-5 text-[color:var(--hs-text-secondary)]">{description}</p></div>
      </li>)}
    </ul>
    <p className="mx-auto mt-5 max-w-[290px] text-center text-xs leading-5 text-[color:var(--hs-text-tertiary)]">We&apos;re building LIVE with privacy in mind. More soon.</p>
  </div>;
}
