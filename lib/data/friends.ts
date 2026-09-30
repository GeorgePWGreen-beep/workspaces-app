"use client";

import { createClient } from "../supabase/client";
import type { FriendAction, FriendProfile, FriendRequest } from "../../types/friends";
import { normalizeFriendUsername, validFriendUsername } from "../../utils/friends";

/** Reuses the existing authenticated, fixed public-field projection. Exact usernames only. */
export async function searchProfiles(query: string): Promise<FriendProfile[]> {
  const username = normalizeFriendUsername(query);
  if (!validFriendUsername(username)) return [];
  const { data, error } = await createClient().rpc("get_public_profile", { requested_username: username });
  if (error) throw error;
  return data ?? [];
}

/** One canonical load for all three lists. Page through PostgREST's result limit. */
export async function getFriendships(): Promise<FriendRequest[]> {
  const client = createClient();
  const rows: FriendRequest[] = [];
  for (let start = 0; ; start += 100) {
    const { data, error } = await client.rpc("get_friendships").order("created_at", { ascending: false }).order("id").range(start, start + 99);
    if (error) throw error;
    for (const row of data ?? []) {
      const { profile_id, username, display_name, avatar_url, ...friendship } = row;
      rows.push({ ...friendship, profile: { id: profile_id, username, display_name, avatar_url } });
    }
    if (!data || data.length < 100) return rows;
  }
}

export async function sendFriendRequest(userId: string, addresseeId: string) {
  const { data, error } = await createClient().from("friendships").insert({ requester_id: userId, addressee_id: addresseeId }).select("id").single();
  if (error || !data) throw error ?? new Error("No request returned");
}

export async function changeFriendship(action: FriendAction, row: FriendRequest, userId: string) {
  const client = createClient();
  const query = action === "accept"
    ? client.from("friendships").update({ status: "accepted" }).eq("id", row.id).eq("status", "pending").eq("addressee_id", userId)
    : client.from("friendships").delete().eq("id", row.id).eq("status", action === "remove" ? "accepted" : "pending");
  // Filters protect against stale actions, while RLS remains authoritative.
  if (action === "decline") query.eq("addressee_id", userId);
  if (action === "cancel") query.eq("requester_id", userId);
  const { data, error } = await query.select("id").single();
  if (error || !data) throw error ?? new Error("No relationship returned");
}
