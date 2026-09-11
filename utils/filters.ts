import { CITY_CONFIG, type City } from "../lib/cities";
import type { Cafe } from "../types/cafe";
import type { CafeFilters, QuickFilterKey } from "../types/filters";
import { getOpeningStatus } from "./openingHours";
import { estimateWalkMinutes, type Coordinates } from "./walking";

export type CafeOpeningState = "open" | "closed" | "unknown";

// Product policy: Open now shows confirmed openings. Unknown hours are kept
// distinct from closed, and remain visible whenever this filter is off.
export const OPEN_NOW_INCLUDES_UNKNOWN = false;

export function getCafeOpeningState(cafe: Cafe, now: Date | null): CafeOpeningState {
  if (!cafe.weeklyOpeningHours || !now || Number.isNaN(now.getTime())) return "unknown";
  return getOpeningStatus(cafe.weeklyOpeningHours, now, CITY_CONFIG[cafe.city].timeZone).isOpen
    ? "open"
    : "closed";
}

export function matchesOpenNow(cafe: Cafe, now: Date | null): boolean {
  const state = getCafeOpeningState(cafe, now);
  return state === "open" || (state === "unknown" && OPEN_NOW_INCLUDES_UNKNOWN);
}

type FilterContext = {
  city: City;
  search: string;
  coordinates: Coordinates | null;
  now: Date | null;
};

function matchesCategory<T>(selected: readonly T[], value: T): boolean {
  return selected.length === 0 || selected.includes(value);
}

/** OR inside each category, AND between categories, search, and the chosen city.
 * Null optional data stays visible until its corresponding filter is selected.
 * A selected walk limit is suspended while user location is unavailable. */
export function filterCafes(cafes: readonly Cafe[], filters: CafeFilters, context: FilterContext): Cafe[] {
  const search = context.search.trim().toLowerCase();
  return cafes.filter((cafe) => {
    if (cafe.city !== context.city || !cafe.name.toLowerCase().includes(search)) return false;
    if (cafe.studyScore < filters.minStudyScore) return false;
    if (!matchesCategory(filters.prices, cafe.price) ||
      !matchesCategory(filters.wifi, cafe.wifi) ||
      !matchesCategory(filters.noise, cafe.noise) ||
      !matchesCategory(filters.sockets, cafe.sockets) ||
      !matchesCategory(filters.busyness, cafe.busyness) ||
      !matchesCategory(filters.coffee, cafe.coffee) ||
      !matchesCategory(filters.seating, cafe.seating)) return false;
    if (filters.cafeType === "independent" && cafe.isIndependent !== true) return false;
    if (filters.cafeType === "non-independent" && cafe.isIndependent !== false) return false;
    if (filters.minSeats !== null && (cafe.seatCount === null || cafe.seatCount < filters.minSeats)) return false;
    if (filters.maxWalkMinutes !== null && context.coordinates) {
      const minutes = estimateWalkMinutes(context.coordinates, cafe.coords);
      if (minutes === null || minutes > filters.maxWalkMinutes) return false;
    }
    if (filters.openNow && !matchesOpenNow(cafe, context.now)) return false;
    return true;
  });
}

function isOnly<T>(values: readonly T[], value: T): boolean {
  return values.length === 1 && values[0] === value;
}

/** Quick presets use the same categories as the sheet; no second filter state. */
export function isQuickFilterActive(filters: CafeFilters, key: QuickFilterKey): boolean {
  switch (key) {
    case "openNow": return filters.openNow;
    case "quiet": return isOnly(filters.noise, "Quiet");
    case "wifi": return isOnly(filters.wifi, "Great WiFi");
    case "sockets": return isOnly(filters.sockets, "Plenty");
    case "independent": return filters.cafeType === "independent";
  }
}

/** Clicking a mixed category narrows it to the preset; clicking it again clears it. */
export function toggleQuickFilter(filters: CafeFilters, key: QuickFilterKey): CafeFilters {
  const active = isQuickFilterActive(filters, key);
  switch (key) {
    case "openNow": return { ...filters, openNow: !active };
    case "quiet": return { ...filters, noise: active ? [] : ["Quiet"] };
    case "wifi": return { ...filters, wifi: active ? [] : ["Great WiFi"] };
    case "sockets": return { ...filters, sockets: active ? [] : ["Plenty"] };
    case "independent": return { ...filters, cafeType: active ? "all" : "independent" };
  }
}

/** Count active categories, not individual OR selections. */
export function countActiveFilters(filters: CafeFilters): number {
  return [
    filters.minStudyScore > 0,
    filters.prices.length > 0,
    filters.wifi.length > 0,
    filters.noise.length > 0,
    filters.sockets.length > 0,
    filters.busyness.length > 0,
    filters.cafeType !== "all",
    filters.coffee.length > 0,
    filters.seating.length > 0,
    filters.minSeats !== null,
    filters.maxWalkMinutes !== null,
    filters.openNow,
  ].filter(Boolean).length;
}

/** Extra categories not already explained by a selected quick-filter chip. */
export function countExtendedFilters(filters: CafeFilters): number {
  const quickKeys: QuickFilterKey[] = ["openNow", "quiet", "wifi", "sockets", "independent"];
  return countActiveFilters(filters) - quickKeys.filter((key) => isQuickFilterActive(filters, key)).length;
}
