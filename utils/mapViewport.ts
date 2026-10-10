import type { Cafe } from "../types/cafe";
import type { CafeFilters } from "../types/filters";
import { normalizeCafeSearch } from "./cafeSearch";

export function resultsViewportKey(search: string, filters: CafeFilters, selectionVersion: number): string {
  // Equivalent OR selections and cosmetic query changes do not move the map.
  return JSON.stringify([normalizeCafeSearch(search), Object.entries(filters).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => [key, Array.isArray(value) ? [...value].sort() : value]), selectionVersion]);
}

export function resultsCamera(cafes: readonly Pick<Cafe, "coords">[]) {
  if (!cafes.length) return null;
  if (cafes.length === 1) return { kind: "focus" as const, center: cafes[0].coords, zoom: 16 };
  const lngs = cafes.map(cafe => cafe.coords[0]);
  const lats = cafes.map(cafe => cafe.coords[1]);
  return { kind: "fit" as const, bounds: [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]] as [[number, number], [number, number]], maxZoom: 15 };
}

export function resultsPadding(height: number, mobile: boolean, sheetOpen: boolean, controlsBottom = 0) {
  const bottom = Math.round(height * (sheetOpen ? 0.47 : 0.16));
  return mobile
    ? { top: Math.min(height - bottom - 32, Math.max(Math.min(300, Math.round(height * 0.38)), controlsBottom + 48)), bottom, left: 40, right: 40 }
    : { top: 70, bottom: 70, left: 70, right: 70 };
}
