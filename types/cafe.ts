import type { City } from "../lib/cities";
import type { WeeklyOpeningHours } from "./openingHours";

export type Cafe = {
  // Database identity is absent only in the development fallback dataset.
  id?: string;
  slug?: string;
  address?: string;
  city: City;
  isIndependent: boolean | null;
  seatCount: number | null;
  lastVerifiedAt: string | null;
  weeklyOpeningHours: WeeklyOpeningHours | null;
  name: string;
  studyScore: number;
  coords: [number, number];

  wifi: "Great WiFi" | "Good WiFi" | "Okay WiFi";
  noise: "Quiet" | "Moderate" | "Loud";
  sockets: "Plenty" | "Some" | "Few";
  busyness: "Quiet" | "Moderate" | "Busy";

  rating: number;
  price: "£" | "££" | "£££";

  image: string;

  description: string;

  coffee: "Excellent" | "Good" | "Basic";

  seating: "Comfortable" | "Average" | "Basic";

  openingHours: string | null;
};
