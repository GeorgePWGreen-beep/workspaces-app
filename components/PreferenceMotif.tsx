/** Decorative workspace geometry; no scoring or preference meaning. */
export default function PreferenceMotif({ className }: { className?: string }) {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 120 100" fill="none" className={className}>
    <rect x="16" y="8" width="88" height="84" rx="28" fill="currentColor" opacity=".06" />
    <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 61h72M31 61v21m58-21v21M43 49h35l5 12H38l5-12Z" />
      <path d="M45 49V29a3 3 0 0 1 3-3h25a3 3 0 0 1 3 3v20M55 68h12m-6 0v13m-9 0h18" />
      <path d="M87 43c0-9 5-14 11-16 0 8-3 15-11 16Zm0 0v10" opacity=".65" />
      <path d="M22 28h9m-4.5-4.5v9" opacity=".35" />
    </g>
  </svg>;
}
