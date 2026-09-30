import type { FriendRequest } from "../types/friends";

export function normalizeFriendUsername(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}
export function validFriendUsername(value: string) { return /^[a-z0-9_]{3,20}$/.test(value); }
export function groupFriendships(rows: FriendRequest[], userId: string) {
  return {
    friends: rows.filter(row => row.status === "accepted"),
    incoming: rows.filter(row => row.status === "pending" && row.addressee_id === userId),
    outgoing: rows.filter(row => row.status === "pending" && row.requester_id === userId),
  };
}
export function friendError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : null;
  if (code === "23505") return "You already have a request or friendship with this person. Refresh to see the latest status.";
  if (code === "23503") return "That account is no longer available.";
  if (code === "PGRST116") return "This request or friendship has changed or was removed. Refresh and try again.";
  if (code === "42501") return "This action is no longer available. Refresh, or sign in again.";
  return "We couldn’t update Friends. Check your connection and try again.";
}
