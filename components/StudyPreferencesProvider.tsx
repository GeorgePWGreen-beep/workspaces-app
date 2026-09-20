"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { Cafe } from "@/types/cafe";
import { validPreferences, type StudyPreferences } from "@/types/studyPreferences";
import { calculateMatch, type MatchResult } from "@/utils/matchV1";

type Status = "logged-out" | "loading" | "missing" | "available" | "error";
type Value = { status: Status; preferences: StudyPreferences | null; matches: ReadonlyMap<Cafe, MatchResult>; editorOpen: boolean; openEditor: () => void; closeEditor: () => void; retry: () => void; save: (p: StudyPreferences) => Promise<boolean>; reset: () => Promise<boolean>; busy: boolean; error: string | null };
const Context = createContext<Value | null>(null);
export function StudyPreferencesProvider({ cafes, children }: { cafes: Cafe[]; children: React.ReactNode }) {
  const auth = useAuth();
  const [skipped] = useState(() => new Set<string>());
  const userId = !auth.loading ? auth.user?.id : undefined;
  return <PreferencesSession skipped={skipped} userId={userId} restoring={auth.loading} cafes={cafes}>{children}</PreferencesSession>;
}
function PreferencesSession({ skipped, userId, restoring, cafes, children }: { skipped: Set<string>; userId?: string; restoring: boolean; cafes: Cafe[]; children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<StudyPreferences | null>(null);
  const [status, setStatus] = useState<Status>(userId ? "loading" : "logged-out");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [owner, setOwner] = useState(userId);
  if (owner !== userId) {
    setOwner(userId); setPreferences(null); setStatus(userId ? "loading" : "logged-out");
    setEditorOpen(false); setError(null); setBusy(false);
  }
  const generation = useRef(0);
  const alive = useRef(false);
  const submitting = useRef(false);
  useEffect(() => {
    alive.current = true;
    generation.current++;
    if (!userId) return () => { alive.current = false; };
    let cancelled = false;
    async function load() {
      try {
        const { data, error } = await createClient().from("user_study_preferences").select("atmosphere_preference,session_length,priorities").eq("user_id", userId!).maybeSingle();
        if (cancelled) return;
        if (error || (data && !validPreferences(data))) throw new Error("load");
        setPreferences(data); setStatus(data ? "available" : "missing"); setError(null);
        if (!data && !skipped.has(userId!)) setEditorOpen(true);
      } catch { if (!cancelled) { setStatus("error"); setError("Study preferences could not be loaded. Please retry."); } }
    }
    void load();
    return () => { cancelled = true; alive.current = false; };
  }, [userId, attempt, skipped]);
  async function persist(next: StudyPreferences | null) {
    if (!userId || submitting.current || (next && !validPreferences(next))) return false;
    const request = generation.current;
    submitting.current = true; setBusy(true); setError(null);
    try {
      const client = createClient();
      // Separate insert/update preserves column-level protection of user_id.
      const query = next === null ? client.from("user_study_preferences").delete().eq("user_id", userId)
        : status === "available" ? client.from("user_study_preferences").update(next).eq("user_id", userId)
        : client.from("user_study_preferences").insert({ ...next, user_id: userId });
      const { data, error } = await query.select("user_id").single();
      if (error || !data) throw new Error("save");
      if (!alive.current || request !== generation.current) return false;
      if (!next) skipped.add(userId);
      setPreferences(next); setStatus(next ? "available" : "missing"); setEditorOpen(false);
      return true;
    } catch { if (alive.current && request === generation.current) setError("We could not save your preferences. Please try again."); return false; }
    finally { submitting.current = false; if (alive.current && request === generation.current) setBusy(false); }
  }
  const matches = useMemo(() => {
    const result = new Map<Cafe, MatchResult>();
    if (preferences) for (const cafe of cafes) { const match = calculateMatch(cafe, preferences); if (match) result.set(cafe, match); }
    return result;
  }, [cafes, preferences]);
  return <Context.Provider value={{ status: restoring ? "loading" : status, preferences, matches, editorOpen: Boolean(userId) && editorOpen,
    openEditor: () => setEditorOpen(true), closeEditor: () => { if (!submitting.current) { if (userId) skipped.add(userId); setEditorOpen(false); } },
    retry: () => { setStatus("loading"); setError(null); setAttempt(n => n + 1); }, save: p => persist(p), reset: () => persist(null), busy, error }}>{children}</Context.Provider>;
}
export function useStudyPreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("StudyPreferencesProvider required");
  return value;
}
