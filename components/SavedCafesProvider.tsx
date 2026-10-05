"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Cafe } from "@/types/cafe";
import { useAuth } from "./AuthProvider";

type SavedState = {
  cafes: Cafe[];
  ids: Set<string>;
  pending: Set<string>;
  loading: boolean;
  loadFailed: boolean;
  error: string | null;
  signedIn: boolean;
  retry: () => void;
  toggle: (cafe: Cafe) => Promise<void>;
};
const SavedContext = createContext<SavedState | null>(null);

export function SavedCafesProvider({ cafes, children }: { cafes: Cafe[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  return <SavedSession cafes={cafes} userId={user?.id ?? null} authLoading={loading}>{children}</SavedSession>;
}

function SavedSession({ cafes, userId, authLoading, children }: { cafes: Cafe[]; userId: string | null; authLoading: boolean; children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(Boolean(userId));
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [owner, setOwner] = useState(userId);
  const locks = useRef(new Set<string>());
  const session = useRef(0);
  // Reset before children render, without remounting the map or auth flow.
  if (owner !== userId) {
    setOwner(userId); setIds(new Set()); setPending(new Set());
    setLoading(Boolean(userId)); setLoadFailed(false); setError(null);
  }
  useEffect(() => {
    locks.current = new Set();
    return () => { session.current += 1; };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const client = createClient();
        const collected = new Set<string>();
        for (let offset = 0; ; offset += 100) {
          const { data, error } = await client.from("saved_cafes").select("cafe_id")
            .eq("user_id", userId).order("created_at", { ascending: false }).order("cafe_id").range(offset, offset + 99);
          if (error) throw error;
          for (const row of data) collected.add(row.cafe_id);
          if (data.length < 100) break;
        }
        if (!cancelled) { setIds(collected); setLoadFailed(false); setError(null); }
      } catch {
        if (!cancelled) { setLoadFailed(true); setError("Couldn't load your saved cafes. Please try again."); }
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [userId, attempt]);

  const toggle = useCallback(async (cafe: Cafe) => {
    if (!userId || loading || loadFailed) return;
    const id = cafe.id;
    if (!id) { setError("This cafe can't be saved right now. Please try again later."); return; }
    if (locks.current.has(id)) return;
    const currentSession = session.current;
    const currentLocks = locks.current;
    const wasSaved = ids.has(id);
    locks.current.add(id); setPending(new Set(locks.current)); setError(null);
    const update = (saved: boolean) => setIds(current => {
      const next = new Set(current); if (saved) next.add(id); else next.delete(id); return next;
    });
    update(!wasSaved);
    try {
      const client = createClient();
      const { error } = wasSaved
        ? await client.from("saved_cafes").delete().eq("user_id", userId).eq("cafe_id", id)
        : await client.from("saved_cafes").insert({ user_id: userId, cafe_id: id });
      if (error && !(error.code === "23505" && !wasSaved)) throw error;
    } catch {
      if (session.current === currentSession) {
        update(wasSaved);
        setError(wasSaved ? "Couldn't remove this cafe. Please try again." : "Couldn't save this cafe. Please try again.");
      }
    } finally {
      currentLocks.delete(id);
      if (session.current === currentSession) setPending(new Set(currentLocks));
    }
  }, [ids, userId, loading, loadFailed]);

  const byId = new Map(cafes.map(cafe => [cafe.id, cafe]));
  const savedCafes = Array.from(ids).flatMap(id => byId.has(id) ? [byId.get(id)!] : []);
  return <SavedContext.Provider value={{ cafes: savedCafes, ids, pending, loading: loading || authLoading, loadFailed, error, signedIn: Boolean(userId), toggle,
    retry: () => { setLoading(true); setError(null); setAttempt(current => current + 1); },
  }}>{children}</SavedContext.Provider>;
}

export function useSavedCafes() {
  const context = useContext(SavedContext);
  if (!context) throw new Error("Saved cafes require SavedCafesProvider");
  return context;
}
