import type { City } from "@/lib/cities";
import type { WeeklyOpeningHours } from "./openingHours";

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
          study_score: number;
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
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type CafeRow = Database["public"]["Tables"]["cafes"]["Row"];
