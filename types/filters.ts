import type { Cafe } from "./cafe";

export type CafeFilters = {
  minStudyScore: number;
  prices: Cafe["price"][];
  wifi: Cafe["wifi"][];
  noise: Cafe["noise"][];
  sockets: Cafe["sockets"][];
  busyness: Cafe["busyness"][];
  cafeType: "all" | "independent" | "non-independent";
  coffee: Cafe["coffee"][];
  seating: Cafe["seating"][];
  minSeats: number | null;
  maxWalkMinutes: number | null;
  openNow: boolean;
};

export type QuickFilterKey = "openNow" | "quiet" | "wifi" | "sockets" | "independent";

export const FILTER_OPTIONS = {
  minStudyScore: [0, 50, 60, 70, 80, 90],
  prices: ["£", "££", "£££"],
  wifi: ["Great WiFi", "Good WiFi", "Okay WiFi"],
  noise: ["Quiet", "Moderate", "Loud"],
  sockets: ["Plenty", "Some", "Few"],
  busyness: ["Quiet", "Moderate", "Busy"],
  cafeType: ["all", "independent", "non-independent"],
  coffee: ["Excellent", "Good", "Basic"],
  seating: ["Comfortable", "Average", "Basic"],
  minSeats: [null, 10, 20, 40],
  maxWalkMinutes: [null, 5, 10, 20],
} as const;

/** A fresh object prevents array selections leaking between visits or resets. */
export function createDefaultFilters(): CafeFilters {
  return {
    minStudyScore: 0,
    prices: [],
    wifi: [],
    noise: [],
    sockets: [],
    busyness: [],
    cafeType: "all",
    coffee: [],
    seating: [],
    minSeats: null,
    maxWalkMinutes: null,
    openNow: false,
  };
}
