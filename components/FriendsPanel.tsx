"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { RefreshCw, Search, UserPlus, UsersRound, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { changeFriendship, getFriendships, searchProfiles, sendFriendRequest } from "@/lib/data/friends";
import { friendError, groupFriendships, normalizeFriendUsername, validFriendUsername } from "@/utils/friends";
import type { FriendAction, FriendProfile, FriendRequest } from "@/types/friends";

const primary = "min-h-11 rounded-xl bg-[color:var(--hs-green)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--hs-green-deep)] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2";
const secondary = "min-h-11 rounded-xl px-3 py-2 text-sm font-medium text-[color:var(--hs-text-secondary)] hover:bg-[color:var(--hs-green-soft)] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2";
type Props = { onAuth: (mode: "signin" | "signup") => void; onClose: () => void };

function Avatar({ profile }: { profile: FriendProfile }) {
  const [failed, setFailed] = useState(false);
  return <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[15px] bg-[#e8eee2] text-base font-bold text-[color:var(--hs-green-deep)]">
    {profile.avatar_url?.startsWith("https://") && !failed
      // Public profile images are arbitrary HTTPS URLs; never forward the referring page.
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={profile.avatar_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      : (profile.display_name || profile.username).slice(0, 1).toUpperCase()}
  </span>;
}
function Person({ profile }: { profile: FriendProfile }) {
  return <div className="flex min-w-0 items-center gap-3"><Avatar key={profile.avatar_url} profile={profile} /><div className="min-w-0"><p className="break-words text-[15px] font-semibold">{profile.display_name || profile.username}</p><p className="break-all text-xs leading-5 text-[color:var(--hs-text-secondary)]">@{profile.username}</p></div></div>;
}

export default function FriendsPanel({ onAuth, onClose }: Props) {
  const auth = useAuth();
  return <div className="px-5 pb-8 pt-1 text-[color:var(--hs-text)]">
    <header className="mb-5 flex items-start justify-between gap-3">
      <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[color:var(--hs-green-deep)]">Your study circle</p><h2 className="text-[28px] font-bold leading-tight tracking-[-.035em]">Friends</h2></div>
      <button type="button" aria-label="Close Friends" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[color:var(--hs-border)] bg-white"><X aria-hidden="true" className="h-5 w-5" /></button>
    </header>
    {auth.loading ? <p role="status" className="py-8 text-sm">Loading your account…</p> : !auth.user ? <div className="rounded-[22px] border border-[color:var(--hs-border)] bg-white p-5">
      <UsersRound aria-hidden="true" className="mb-4 h-7 w-7 text-[color:var(--hs-green)]" strokeWidth={1.6} />
      <p className="text-lg font-semibold leading-6">Sign in to connect with friends.</p><p className="mt-2 text-sm leading-6 text-[color:var(--hs-text-secondary)]">Find the people you like to study with.</p>
      <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => onAuth("signin")} className={primary}>Sign in</button><button type="button" onClick={() => onAuth("signup")} className={secondary}>Create account</button></div>
    </div> : <FriendNetwork key={auth.user.id} userId={auth.user.id} />}
  </div>;
}

function FriendNetwork({ userId }: { userId: string }) {
  const [rows, setRows] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"friends" | "requests">("friends");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<FriendProfile | null>(null);
  const [searchMessage, setSearchMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const mounted = useRef(false), submitting = useRef(false);
  const loadVersion = useRef(0), searchVersion = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const groups = groupFriendships(rows, userId);

  const refresh = useCallback(async () => {
    const version = ++loadVersion.current;
    try {
      const next = await getFriendships();
      if (mounted.current && version === loadVersion.current) { setRows(next); setLoadError(false); }
    } catch { if (mounted.current && version === loadVersion.current) setLoadError(true); }
    finally { if (mounted.current && version === loadVersion.current) setLoading(false); }
  }, []);
  useEffect(() => {
    const loads = loadVersion, searches = searchVersion;
    mounted.current = true;
    void refresh();
    return () => { mounted.current = false; loads.current++; searches.current++; };
  }, [refresh]);

  async function search(event: FormEvent) {
    event.preventDefault();
    const username = normalizeFriendUsername(query);
    const version = ++searchVersion.current;
    setResult(null); setSearchMessage("");
    if (!validFriendUsername(username)) { setSearchMessage("Enter a full username: 3–20 letters, numbers or underscores."); return; }
    setSearching(true);
    try {
      const profiles = await searchProfiles(username);
      if (!mounted.current || version !== searchVersion.current) return;
      const found = profiles[0];
      if (found?.id === userId) setSearchMessage("That’s you. Search for a friend’s username.");
      else if (found) setResult(found);
      else setSearchMessage("No user found. Check the full username and try again.");
    } catch { if (mounted.current && version === searchVersion.current) setSearchMessage("Search is unavailable right now. Please try again."); }
    finally { if (mounted.current && version === searchVersion.current) setSearching(false); }
  }
  async function perform(action: FriendAction | "send", target: FriendRequest | FriendProfile) {
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError(null); setNotice("");
    try {
      if (action === "send") await sendFriendRequest(userId, target.id);
      else await changeFriendship(action, target as FriendRequest, userId);
      if (mounted.current) { setNotice({ send: "Friend request sent.", accept: "You’re now friends.", decline: "Request declined.", cancel: "Request cancelled.", remove: "Friend removed." }[action]); setConfirmRemove(null); }
    } catch (error) { if (mounted.current) setError(friendError(error)); }
    finally {
      // Refetch on success and stale/duplicate failures so every view shares server state.
      if (mounted.current) await refresh();
      submitting.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  function reload() { setNotice(""); setError(null); setLoading(true); void refresh(); }
  function findFriends() { setShowSearch(true); window.requestAnimationFrame(() => input.current?.focus()); }
  const relationship = result ? rows.find(row => row.profile.id === result.id) : undefined;

  function actions(row: FriendRequest) {
    if (row.status === "accepted") return confirmRemove === row.id ? <div className="mt-3 border-t border-[color:var(--hs-border)] pt-3"><p className="text-sm">Remove @{row.profile.username} from friends?</p><div className="mt-2 flex flex-wrap gap-1"><button type="button" disabled={busy} className={primary} onClick={() => void perform("remove", row)}>Remove friend</button><button type="button" disabled={busy} className={secondary} onClick={() => setConfirmRemove(null)}>Keep friend</button></div></div>
      : <div className="mt-2 flex items-center justify-between gap-2"><span className="text-xs font-medium text-[color:var(--hs-green-deep)]">Friends</span><button type="button" disabled={busy} className={secondary} onClick={() => setConfirmRemove(row.id)}>Remove</button></div>;
    return <div className="mt-3 flex flex-wrap items-center gap-2">{row.addressee_id === userId ? <><button type="button" disabled={busy} className={primary} onClick={() => void perform("accept", row)}>Accept</button><button type="button" disabled={busy} className={secondary} onClick={() => void perform("decline", row)}>Decline</button></> : <><span className="mr-auto text-xs text-[color:var(--hs-text-secondary)]">Request sent</span><button type="button" disabled={busy} className={secondary} onClick={() => void perform("cancel", row)}>Cancel request</button></>}</div>;
  }
  function list(items: FriendRequest[]) { return <ul className="space-y-3">{items.map(row => <li key={row.id} className="rounded-[20px] border border-[color:var(--hs-border)] bg-white p-4"><Person profile={row.profile} />{actions(row)}</li>)}</ul>; }

  return <>
    <div className="mb-4 flex items-center justify-between gap-2"><button type="button" className={`${secondary} flex items-center gap-2 px-0 text-[color:var(--hs-green-deep)]`} onClick={findFriends}><UserPlus aria-hidden="true" className="h-4 w-4" />Find friends</button><button type="button" aria-label="Refresh friends" disabled={busy || loading} className={secondary} onClick={reload}><RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button></div>
    {showSearch && <section aria-label="Find friends" className="mb-5 rounded-[20px] border border-[#d5dfce] bg-[#eef3e8] p-4">
      <form onSubmit={search}><label htmlFor={`friend-username-${userId}`} className="text-sm font-semibold">Find by username</label><p className="mb-3 mt-1 text-xs leading-5 text-[color:var(--hs-text-secondary)]">Use their full username. An @ is optional.</p><div className="flex gap-2"><input ref={input} id={`friend-username-${userId}`} value={query} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={21} placeholder="@username" onChange={event => { searchVersion.current++; setSearching(false); setQuery(event.target.value); setResult(null); setSearchMessage(""); }} className="h-12 min-w-0 flex-1 rounded-xl border border-[#cbd5c4] bg-white px-3 text-base outline-none focus:ring-2 focus:ring-[color:var(--hs-green)]" /><button type="submit" disabled={searching || !query.trim()} aria-label="Search users" className={primary}><Search aria-hidden="true" className="h-4 w-4" /></button></div></form>
      {searching && <p role="status" className="mt-3 text-sm">Searching…</p>}
      {searchMessage && <p role="status" className="mt-3 text-sm leading-5">{searchMessage}</p>}
      {result && <div className="mt-4 rounded-2xl border border-[color:var(--hs-border)] bg-white p-3"><Person profile={result} />{relationship?.status === "accepted" ? <p className="mt-3 text-sm font-medium text-[color:var(--hs-green-deep)]">Friends</p> : relationship ? actions(relationship) : <button type="button" disabled={busy || loading || loadError} className={`${primary} mt-3 w-full`} onClick={() => void perform("send", result)}>Add friend</button>}</div>}
    </section>}
    <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-[#eaece5] p-1" aria-label="Friends views">{(["friends", "requests"] as const).map(value => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)} className={`min-h-11 rounded-xl px-2 text-sm font-semibold ${tab === value ? "bg-white shadow-sm" : "text-[color:var(--hs-text-secondary)]"}`}>{value === "friends" ? `Friends (${groups.friends.length})` : `Requests (${groups.incoming.length + groups.outgoing.length})`}</button>)}</div>
    {notice && <p role="status" className="mb-4 text-sm text-[color:var(--hs-green-deep)]">{notice}</p>}
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-800">{error}</p>}
    {loadError && <div role="alert" className="mb-4 rounded-xl border border-[color:var(--hs-border)] bg-white p-3 text-sm leading-5">Friends couldn’t be loaded. Please try again.<button type="button" disabled={busy || loading} onClick={reload} className={`${secondary} block`}>Retry friends</button></div>}
    {loading && <p role="status" className="py-5 text-sm text-[color:var(--hs-text-secondary)]">Loading friends…</p>}
    {!loading && (tab === "friends" ? groups.friends.length ? list(groups.friends) : !loadError && <div className="rounded-[22px] border border-[color:var(--hs-border)] bg-white p-5"><UsersRound aria-hidden="true" className="mb-4 h-7 w-7 text-[color:var(--hs-green)]" strokeWidth={1.6} /><h3 className="text-lg font-semibold">Find people you study with.</h3><p className="mt-2 text-sm leading-6 text-[color:var(--hs-text-secondary)]">Add friends by username. Later, you’ll be able to see when friends are studying at a café.</p><button type="button" className={`${primary} mt-4`} onClick={findFriends}>Find friends</button></div>
      : <div className="space-y-6"><section aria-label="Incoming requests"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--hs-text-secondary)]">Incoming</h3>{groups.incoming.length ? list(groups.incoming) : !loadError && <p className="py-3 text-sm text-[color:var(--hs-text-secondary)]">No new requests</p>}</section><section aria-label="Outgoing requests"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--hs-text-secondary)]">Sent</h3>{groups.outgoing.length ? list(groups.outgoing) : !loadError && <p className="py-3 text-sm text-[color:var(--hs-text-secondary)]">No pending requests sent</p>}</section></div>)}
  </>;
}
