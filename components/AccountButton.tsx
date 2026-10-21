"use client";

import { UserRound } from "lucide-react";
import { useAuth } from "./AuthProvider";
import ProfileAvatar from "./ProfileAvatar";

export default function AccountButton({ onClick }: { onClick: () => void }) {
  const { user, profile } = useAuth();
  return <button type="button" onClick={onClick} aria-haspopup="dialog"
    aria-label={user ? `Open account${profile ? ` for ${profile.username}` : ""}` : "Open profile"}
    className="hs-glass-strong grid h-12 w-12 shrink-0 place-items-center rounded-full text-[color:var(--hs-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hs-green)] focus-visible:ring-offset-2">
    {user ? <ProfileAvatar name={profile?.display_name || profile?.username || "Hot Seats"} source={profile?.avatar_url} size="small" />
      : <UserRound aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />}
  </button>;
}
