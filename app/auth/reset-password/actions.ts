"use server";

import { createClient } from "@/lib/supabase/server";
import { updateRecoveredPassword, type PasswordUpdateResult } from "@/utils/passwordRecovery";

export async function resetPassword(password: string, confirmation: string): Promise<PasswordUpdateResult> {
  // Server Actions are public entry points. Validate input and session on every call.
  if (typeof password !== "string" || typeof confirmation !== "string" || password.length > 4096 || confirmation.length > 4096) {
    return { ok: false, message: "Enter a valid new password and confirmation." };
  }
  try {
    const client = await createClient();
    return await updateRecoveredPassword(client.auth, password, confirmation);
  } catch { return { ok: false, message: "We couldn’t connect. Check your connection and try again." }; }
}
