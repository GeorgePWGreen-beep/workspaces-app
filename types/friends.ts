import type { PublicProfile } from "./profile";

export type FriendshipStatus = "pending" | "accepted";
export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
};
export type FriendProfile = PublicProfile;
export type FriendRequest = Friendship & { profile: FriendProfile };
export type FriendshipProjection = Friendship & {
  profile_id: string; username: string; display_name: string | null; avatar_url: string | null;
};
export type FriendAction = "accept" | "decline" | "cancel" | "remove";
