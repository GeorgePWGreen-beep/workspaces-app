export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicProfile = Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
