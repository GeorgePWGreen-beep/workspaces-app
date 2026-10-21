"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/profile";
import { authErrorMessage, recoveryRequestResult, validateRecoveryEmail, normalizeUsername, validateAuthFields, type AuthFields, type AuthResult } from "@/utils/auth";
import { updateOwnProfile, type ProfileUpdateResult } from "@/lib/data/profile";
import type { ProfileEdits } from "@/utils/profile";

type AuthState = { loading: boolean; user: User | null; profile: Profile | null; error: string | null };
type AuthContextValue = AuthState & {
  busy: boolean;
  signUp: (fields: AuthFields) => Promise<AuthResult>;
  signIn: (fields: AuthFields) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updateProfile: (edits: ProfileEdits) => Promise<ProfileUpdateResult>;
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

  async function perform<T extends { ok: boolean }>(action: () => Promise<T>): Promise<T | { ok: false; message: string }> {
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

  async function requestPasswordReset(email: string): Promise<AuthResult> {
    const error = validateRecoveryEmail(email);
    if (error) return { ok: false, field: "email", message: error };
    return perform(async () => {
      const { error } = await client!.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/recovery`,
      });
      return recoveryRequestResult(error);
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

  async function updateProfile(edits: ProfileEdits): Promise<ProfileUpdateResult> {
    const userId = state.user?.id;
    if (!userId || !state.profile || state.profile.id !== userId) return { ok: false, message: "Your profile isn’t available. Close the editor and retry your account." };
    const request = generation.current;
    return perform(async () => {
      const result = await updateOwnProfile(client!, userId, edits);
      if (!result.ok) return result;
      // Do not restore a stale user/profile after a sign-out or session refresh.
      if (!mounted.current || generation.current !== request) {
        if (mounted.current) void refresh();
        return { ok: false as const, message: "Your session changed while saving. Reopen your profile to check the latest details." };
      }
      generation.current++;
      setState(current => current.user?.id === userId ? { ...current, profile: result.profile } : current);
      return result;
    });
  }

  return <AuthContext.Provider value={{ ...state, busy, signUp, signIn, signOut, requestPasswordReset, updateProfile,
    retry: () => { setState((current) => ({ ...current, loading: true })); void refresh(); } }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth requires AuthProvider");
  return value;
}
