import type { StudyPreferencesRow, StudyPreferences } from "./studyPreferences";
import type { City } from "@/lib/cities";
import type { WeeklyOpeningHours } from "./openingHours";
import type { Profile, PublicProfile } from "./profile";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_study_preferences: {
        Row: StudyPreferencesRow;
        Insert: StudyPreferences & { user_id: string };
        Update: Partial<StudyPreferences>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Pick<Profile, "id" | "username"> & Partial<Omit<Profile, "id" | "username">>;
        Update: Partial<Pick<Profile, "username" | "display_name" | "avatar_url">>;
        Relationships: [];
      };
      cafes: {
        Row: {
          city: City;
          is_independent: boolean | null;
          seat_count: number | null;
          last_verified_at: string | null;
          weekly_opening_hours: WeeklyOpeningHours | null;
          id: string;
          slug: string;
          name: string;
          description: string;
          latitude: number;
          longitude: number;
          study_score: number;
          wifi: "Great WiFi" | "Good WiFi" | "Okay WiFi";
          noise: "Quiet" | "Moderate" | "Loud";
          sockets: "Plenty" | "Some" | "Few";
          busyness: "Quiet" | "Moderate" | "Busy";
          rating: number;
          price: "£" | "££" | "£££";
          walk_time: number | null;
          image_url: string;
          coffee: "Excellent" | "Good" | "Basic";
          seating: "Comfortable" | "Average" | "Basic";
          opening_hours: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          city: City;
          is_independent?: boolean | null;
          seat_count?: number | null;
          last_verified_at?: string | null;
          weekly_opening_hours?: WeeklyOpeningHours | null;
          id?: string;
          slug: string;
          name: string;
          description: string;
          latitude: number;
          longitude: number;
          // Calculated by the v1 trigger when inputs are complete. Incomplete
          // legacy inserts still require an explicit retained score.
          study_score?: number;
          wifi: "Great WiFi" | "Good WiFi" | "Okay WiFi";
          noise: "Quiet" | "Moderate" | "Loud";
          sockets: "Plenty" | "Some" | "Few";
          busyness: "Quiet" | "Moderate" | "Busy";
          rating: number;
          price: "£" | "££" | "£££";
          walk_time?: number | null;
          image_url: string;
          coffee: "Excellent" | "Good" | "Basic";
          seating: "Comfortable" | "Average" | "Basic";
          opening_hours?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cafes"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_username_available: { Args: { candidate: string }; Returns: boolean };
      get_public_profile: { Args: { requested_username: string }; Returns: PublicProfile[] };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type CafeRow = Database["public"]["Tables"]["cafes"]["Row"];
