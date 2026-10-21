import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database";
import type { Profile } from "../../types/profile";
import { normalizeDisplayName, validateProfileEdits, type ProfileEdits } from "../../utils/profile";

export type ProfileUpdateResult = { ok: true; profile: Profile } | { ok: false; message: string; field?: keyof ProfileEdits };

/** Uses the caller's existing authenticated client. RLS is the ownership boundary. */
export async function updateOwnProfile(client: SupabaseClient<Database>, userId: string, edits: ProfileEdits): Promise<ProfileUpdateResult> {
  if (!userId) return { ok: false, message: "Sign in again to edit your profile." };
  const errors = validateProfileEdits(edits);
  for (const field of ["displayName", "avatar"] as const) {
    if (errors[field]) return { ok: false, field, message: errors[field] };
  }
  const changes = { display_name: normalizeDisplayName(edits.displayName), ...(edits.avatar === undefined ? {} : { avatar_url: edits.avatar }) };
  try {
    const { data, error } = await client.from("profiles").update(changes).eq("id", userId)
      .select("id,username,display_name,avatar_url,created_at,updated_at").single();
    if (error) {
      if (error.code === "PGRST116") return { ok: false, message: "Your profile could not be found. Close the editor and retry your account." };
      if (error.code === "42501" || error.code === "PGRST301" || error.code === "PGRST303") return { ok: false, message: "Your session could not save these changes. Sign in again and retry." };
      return { ok: false, message: "We couldn’t save your profile. Check your connection and try again." };
    }
    if (!data || data.id !== userId) return { ok: false, message: "Your profile could not be found. Close the editor and retry your account." };
    return { ok: true, profile: data };
  } catch {
    return { ok: false, message: "We couldn’t save your profile. Check your connection and try again." };
  }
}
