"use client";

import { UserRound } from "lucide-react";
import { useAuth } from "./AuthProvider";

export default function AccountButton({ onClick }: { onClick: () => void }) {
  const { user, profile } = useAuth();
  return <button type="button" onClick={onClick} aria-haspopup="dialog"
    aria-label={user ? `Open account${profile ? ` for ${profile.username}` : ""}` : "Open profile"}
    className="hs-glass-strong grid h-12 w-12 shrink-0 place-items-center rounded-full text-[color:var(--hs-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hs-green)] focus-visible:ring-offset-2">
    {user ? <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--hs-green-soft)] text-base font-bold text-[color:var(--hs-green-deep)]">{(profile?.display_name || profile?.username || "H").slice(0,1).toUpperCase()}</span>
      : <UserRound aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />}
  </button>;
}
