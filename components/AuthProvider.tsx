"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/profile";
import { authErrorMessage, normalizeUsername, validateAuthFields, type AuthFields, type AuthResult } from "@/utils/auth";

type AuthState = { loading: boolean; user: User | null; profile: Profile | null; error: string | null };
type AuthContextValue = AuthState & {
  busy: boolean;
  signUp: (fields: AuthFields) => Promise<AuthResult>;
  signIn: (fields: AuthFields) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  retry: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);
const signedOut: AuthState = { loading: false, user: null, profile: null, error: null };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? createClient() : null);
  const [state, setState] = useState<AuthState>({ ...signedOut, loading: true });
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    const request = ++generation.current;
    const publish = (next: AuthState) => {
      if (mounted.current && request === generation.current) setState(next);
    };
    if (!client) {
      // Keep development-only public browsing usable without auth configuration.
      await Promise.resolve();
      publish({ ...signedOut, error: "Accounts aren’t available right now." });
      return;
    }
    try {
      const { data: { user }, error } = await client.auth.getUser();
      if (error || !user) {
        publish({ ...signedOut, error: error && error.name !== "AuthSessionMissingError" ? "We couldn’t restore your session. Try again or sign in." : null });
        return;
      }
      const { data: profile, error: profileError } = await client.from("profiles")
        .select("id,username,display_name,avatar_url,created_at,updated_at").eq("id", user.id).single();
      publish({ loading: false, user, profile: profileError ? null : profile,
        error: profileError ? "Your account is signed in, but its profile couldn’t be loaded. Please retry. If this continues, contact Hot Seats." : null });
    } catch {
      publish({ ...signedOut, error: "We couldn’t connect to your account. Please try again." });
    }
  }, [client]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    // Never await another Supabase operation inside the auth callback: the SDK
    // holds its auth lock there. Profile reads happen after that callback exits.
    const { data } = client?.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION") return;
      if (event === "SIGNED_OUT") {
        generation.current++;
        setState(signedOut);
      } else {
        if (event === "SIGNED_IN") setState({ ...signedOut, loading: true });
        window.setTimeout(() => { if (mounted.current) void refresh(); }, 0);
      }
    }) ?? { data: null };
    return () => { mounted.current = false; data?.subscription.unsubscribe(); };
  }, [client, refresh]);

  async function perform(action: () => Promise<AuthResult>): Promise<AuthResult> {
    if (submitting.current) return { ok: false, message: "Please wait for the current request." };
    if (!client) return { ok: false, message: "Accounts aren’t available right now. Please try again later." };
    submitting.current = true; setBusy(true);
    try { return await action(); }
    catch { return { ok: false, message: "We couldn’t connect. Check your connection and try again." }; }
    finally { submitting.current = false; if (mounted.current) setBusy(false); }
  }

  async function signUp(fields: AuthFields): Promise<AuthResult> {
    const errors = validateAuthFields(fields, true);
    const field = Object.keys(errors)[0] as keyof AuthFields | undefined;
    if (field) return { ok: false, field, message: errors[field]! };
    return perform(async () => {
      const username = normalizeUsername(fields.username);
      const { data: available, error: lookupError } = await client!.rpc("is_username_available", { candidate: username });
      if (lookupError) return { ok: false, message: "New accounts aren’t available right now. Please try again later." };
      if (!available) return { ok: false, field: "username", message: "That username is taken. Try another." };
      const { data, error } = await client!.auth.signUp({
        email: fields.email.trim(), password: fields.password,
        options: { data: { username }, emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (error) {
        // Covers a username taken between preflight and the transactional insert.
        if (error.code === "unexpected_failure" || error.status === 500) {
          const check = await client!.rpc("is_username_available", { candidate: username });
          if (!check.error && check.data === false) return { ok: false, field: "username", message: "That username is taken. Try another." };
        }
        return { ok: false, message: authErrorMessage(error) };
      }
      if (data.session) await refresh();
      return { ok: true, confirmationRequired: !data.session };
    });
  }

  async function signIn(fields: AuthFields): Promise<AuthResult> {
    const errors = validateAuthFields(fields, false);
    const field = Object.keys(errors)[0] as keyof AuthFields | undefined;
    if (field) return { ok: false, field, message: errors[field]! };
    return perform(async () => {
      const { error } = await client!.auth.signInWithPassword({ email: fields.email.trim(), password: fields.password });
      if (error) return { ok: false, message: authErrorMessage(error) };
      await refresh();
      return { ok: true };
    });
  }

  async function signOut(): Promise<AuthResult> {
    return perform(async () => {
      const { error } = await client!.auth.signOut({ scope: "local" });
      if (error) return { ok: false, message: "We couldn’t log out. Please try again." };
      generation.current++;
      setState(signedOut);
      return { ok: true };
    });
  }

  return <AuthContext.Provider value={{ ...state, busy, signUp, signIn, signOut,
    retry: () => { setState((current) => ({ ...current, loading: true })); void refresh(); } }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth requires AuthProvider");
  return value;
}
