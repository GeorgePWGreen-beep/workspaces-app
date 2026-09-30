"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { GUEST_PREFERENCES_KEY, readGuestPreferences } from "@/lib/onboarding";
import type { Cafe } from "@/types/cafe";
import { validPreferences, type StudyPreferences } from "@/types/studyPreferences";
import { calculateMatch, type MatchResult } from "@/utils/matchV1";

type Status = "logged-out" | "loading" | "missing" | "available" | "error";
type Value = {
  status: Status; preferences: StudyPreferences | null; isGuest: boolean;
  matches: ReadonlyMap<Cafe, MatchResult>; editorOpen: boolean;
  openEditor: () => void; closeEditor: () => void; retry: () => void;
  save: (p: StudyPreferences) => Promise<boolean>; reset: () => Promise<boolean>;
  busy: boolean; error: string | null;
};
const Context = createContext<Value | null>(null);
export function StudyPreferencesProvider({ cafes, children }: { cafes: Cafe[]; children: React.ReactNode }) {
  const auth = useAuth();
  return <PreferencesSession userId={auth.user?.id} restoring={auth.loading} cafes={cafes}>{children}</PreferencesSession>;
}
function PreferencesSession({ userId, restoring, cafes, children }: { userId?: string; restoring: boolean; cafes: Cafe[]; children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<StudyPreferences | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [owner, setOwner] = useState(userId);
  if (owner !== userId) {
    setOwner(userId); setPreferences(null); setStatus("loading");
    setEditorOpen(false); setError(null); setBusy(false);
  }
  const generation = useRef(0);
  const submitting = useRef(false);
  const guestMemory = useRef<StudyPreferences | null>(null);
  function clearGuest() {
    guestMemory.current = null;
    try { window.localStorage.removeItem(GUEST_PREFERENCES_KEY); } catch { /* Session-only storage. */ }
  }
  useEffect(() => {
    const request = ++generation.current;
    if (restoring) return;
    let cancelled = false;
    const current = () => !cancelled && request === generation.current;
    async function load() {
      let guest = guestMemory.current;
      try { guest = readGuestPreferences(window.localStorage) ?? guest; } catch { /* Storage disabled. */ }
      guestMemory.current = guest;
      if (!userId) {
        setPreferences(guest); setStatus(guest ? "available" : "logged-out");
        return;
      }
      try {
        const client = createClient();
        let { data, error } = await client.from("user_study_preferences").select("atmosphere_preference,session_length,priorities").eq("user_id", userId).maybeSingle();
        if (!current()) return;
        if (error || (data && !validPreferences(data))) throw new Error("load");
        if (!data && guest) {
          // Claim guest answers once. Never overwrite existing account preferences.
          const inserted = await client.from("user_study_preferences").insert({ ...guest, user_id: userId }).select("atmosphere_preference,session_length,priorities").single();
          if (!current()) return;
          data = inserted.data; error = inserted.error;
          if (error?.code === "23505") {
            const existing = await client.from("user_study_preferences").select("atmosphere_preference,session_length,priorities").eq("user_id", userId).single();
            data = existing.data; error = existing.error;
          }
          if (error || !validPreferences(data)) throw new Error("import");
        }
        if (!current()) return;
        if (data) clearGuest();
        setPreferences(data); setStatus(data ? "available" : "missing"); setError(null);
      } catch {
        if (current()) { setStatus("error"); setError("Study preferences could not be loaded. Please retry."); }
      }
    }
    void load();
    return () => { cancelled = true; generation.current = request + 1; };
  }, [userId, restoring, attempt]);

  async function persist(next: StudyPreferences | null) {
    if (restoring || status === "loading" || status === "error" || submitting.current || (next && !validPreferences(next))) return false;
    if (!userId) {
      guestMemory.current = next;
      try {
        if (next) window.localStorage.setItem(GUEST_PREFERENCES_KEY, JSON.stringify(next));
        else window.localStorage.removeItem(GUEST_PREFERENCES_KEY);
      } catch { /* Still works for this visit when local storage is disabled. */ }
      setPreferences(next); setStatus(next ? "available" : "logged-out"); setEditorOpen(false); setError(null);
      return true;
    }
    const request = generation.current;
    submitting.current = true; setBusy(true); setError(null);
    try {
      const client = createClient();
      // Separate insert/update respects the existing column-level ownership grants.
      const query = next === null ? client.from("user_study_preferences").delete().eq("user_id", userId)
        : status === "available" ? client.from("user_study_preferences").update(next).eq("user_id", userId)
        : client.from("user_study_preferences").insert({ ...next, user_id: userId });
      const { data, error } = await query.select("user_id").single();
      if (error || !data) throw new Error("save");
      if (request !== generation.current) return false;
      clearGuest(); setPreferences(next); setStatus(next ? "available" : "missing"); setEditorOpen(false);
      return true;
    } catch {
      if (request === generation.current) setError("We could not save your preferences. Please try again.");
      return false;
    } finally { submitting.current = false; if (request === generation.current) setBusy(false); }
  }
  const activePreferences = !restoring && status === "available" ? preferences : null;
  const matches = useMemo(() => {
    const result = new Map<Cafe, MatchResult>();
    // Guest answers can be saved for sign-in, but Match belongs to an account.
    if (userId && activePreferences) for (const cafe of cafes) { const match = calculateMatch(cafe, activePreferences); if (match) result.set(cafe, match); }
    return result;
  }, [cafes, activePreferences, userId]);
  return <Context.Provider value={{ status: restoring ? "loading" : status, preferences: activePreferences, isGuest: !userId, matches, editorOpen,
    openEditor: () => setEditorOpen(true), closeEditor: () => { if (!submitting.current) setEditorOpen(false); },
    retry: () => { setStatus("loading"); setError(null); setAttempt(n => n + 1); }, save: p => persist(p), reset: () => persist(null), busy, error }}>{children}</Context.Provider>;
}
export function useStudyPreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("StudyPreferencesProvider required");
  return value;
}
