import type { SupabaseClient } from "@supabase/supabase-js";
import { validateNewPassword } from "./auth";

type RecoveryAuth = Pick<SupabaseClient["auth"], "exchangeCodeForSession" | "getUser" | "getClaims" | "updateUser">;
export type RecoveryStatus = "ready" | "invalid" | "retry";
export type PasswordUpdateResult = { ok: true } | { ok: false; message: string; status?: RecoveryStatus };
export const INVALID_RECOVERY = "This reset link has expired or is no longer valid. Request a new link and open it in the same browser that requested it.";
const CONNECTION_ERROR = "We couldn’t connect. Check your connection and try again.";

function transient(error: { status?: number; name?: string }) {
  return error.name === "AuthRetryableFetchError" || error.status === 0 || (error.status ?? 0) >= 500 || error.status === 429;
}

/** Only call with claims validated by Supabase, never a locally decoded JWT. */
export function hasRecoveryClaims(claims: { sub?: string; exp?: number; amr?: unknown }, userId: string, now = Date.now() / 1000): boolean {
  return claims.sub === userId && typeof claims.exp === "number" && claims.exp > now && Array.isArray(claims.amr) &&
    claims.amr.some(entry => entry && typeof entry === "object" && entry.method === "recovery" &&
      typeof entry.timestamp === "number" && entry.timestamp <= now + 60 && entry.timestamp > now - 3600);
}

export async function recoverySessionStatus(auth: RecoveryAuth): Promise<RecoveryStatus> {
  try {
    // getUser contacts Auth; getClaims verifies the signed session claims.
    const user = await auth.getUser();
    if (user.error) return transient(user.error) ? "retry" : "invalid";
    if (!user.data.user) return "invalid";
    const claims = await auth.getClaims();
    if (claims.error) return transient(claims.error) ? "retry" : "invalid";
    return claims.data && hasRecoveryClaims(claims.data.claims, user.data.user.id) ? "ready" : "invalid";
  } catch { return "retry"; }
}

export async function exchangeRecoveryCode(auth: RecoveryAuth, code: string | null): Promise<RecoveryStatus> {
  if (!code || code.length > 4096) return "invalid";
  try {
    const { data, error } = await auth.exchangeCodeForSession(code);
    if (error) return transient(error) ? "retry" : "invalid";
    if (!data.session) return "invalid";
    // A signup or OAuth code may also exchange successfully; only verified
    // recovery claims can unlock the password form.
    return recoverySessionStatus(auth);
  } catch { return "retry"; }
}

export async function updateRecoveredPassword(auth: RecoveryAuth, password: string, confirmation: string): Promise<PasswordUpdateResult> {
  const errors = validateNewPassword(password, confirmation);
  if (errors.password || errors.confirmation) return { ok: false, message: errors.password ?? errors.confirmation! };
  const status = await recoverySessionStatus(auth);
  if (status !== "ready") return { ok: false, status, message: status === "invalid" ? INVALID_RECOVERY : CONNECTION_ERROR };
  try {
    const { error } = await auth.updateUser({ password });
    if (!error) return { ok: true };
    if (error.status === 429 || error.code?.includes("rate_limit")) return { ok: false, message: "Too many attempts. Please wait a little and try again." };
    if (error.code === "weak_password") return { ok: false, message: "Choose a stronger password with at least 8 characters. Try adding letters, numbers and symbols." };
    if (error.code === "same_password") return { ok: false, message: "Choose a password different from your current one." };
    if (["session_not_found", "refresh_token_not_found", "refresh_token_already_used", "bad_jwt", "reauthentication_needed"].includes(error.code ?? "") || error.status === 401 || error.status === 403) return { ok: false, status: "invalid", message: INVALID_RECOVERY };
    return { ok: false, message: "We couldn’t update your password. Please try again." };
  } catch { return { ok: false, message: CONNECTION_ERROR }; }
}
