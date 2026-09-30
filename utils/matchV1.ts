import type { Cafe } from "../types/cafe";
import { validPreferences, type StudyPreferences, type Priority } from "../types/studyPreferences";

type Factor = "wifi" | "noise" | "seating" | "sockets" | "coffee" | "busyness" | "seatCount";
export type MatchInputs = { [K in Factor]?: Cafe[K] | null };
export type MatchResult = { score: number; components: Partial<Record<Factor, { compatibility: number; weight: number; contribution: number }>>; reasons: string[] };
const base: Record<Factor, number> = { wifi: 18, noise: 15, seating: 15, sockets: 15, coffee: 13, busyness: 12, seatCount: 12 };
const priorityFactor: Record<Priority, Factor> = { wifi: "wifi", sockets: "sockets", seating: "seating", coffee: "coffee", space: "seatCount" };
const noise = { quiet: { Quiet: 100, Moderate: 70, Loud: 25 }, balanced: { Quiet: 90, Moderate: 100, Loud: 55 }, lively: { Quiet: 70, Moderate: 100, Loud: 80 } };
const busyness = { quiet: { Quiet: 100, Moderate: 70, Busy: 30 }, balanced: { Quiet: 90, Moderate: 100, Busy: 65 }, lively: { Quiet: 75, Moderate: 100, Busy: 85 } };
function lookup(table: Record<string, number>, value: unknown): number | null {
  return typeof value === "string" && Object.hasOwn(table, value) ? table[value] : null;
}
/** Compatibility, not probability. Never reads or changes the universal Study Score. */
export function calculateMatch(cafe: MatchInputs, preferences: StudyPreferences): MatchResult | null {
  if (!validPreferences(preferences)) throw new Error("Invalid study preferences");
  const weights = { ...base };
  for (const priority of preferences.priorities) weights[priorityFactor[priority]] *= 1.35;
  const session = preferences.session_length;
  weights.seating *= session === "short" ? 0.85 : session === "long" ? 1.25 : 1;
  weights.sockets *= session === "short" ? 0.75 : session === "long" ? 1.25 : 1;
  weights.seatCount *= session === "short" ? 0.90 : session === "long" ? 1.15 : 1;
  const seats = cafe.seatCount;
  const values: Record<Factor, number | null> = {
    wifi: lookup({ "Great WiFi": 100, "Good WiFi": 75, "Okay WiFi": 45 }, cafe.wifi),
    noise: lookup(noise[preferences.atmosphere_preference], cafe.noise),
    seating: lookup({ Comfortable: 100, Average: 70, Basic: 40 }, cafe.seating),
    sockets: lookup({ Plenty: 100, Some: 70, Few: 35 }, cafe.sockets),
    coffee: lookup({ Excellent: 100, Good: 75, Basic: 40 }, cafe.coffee),
    busyness: lookup(busyness[preferences.atmosphere_preference], cafe.busyness),
    seatCount: typeof seats === "number" && Number.isInteger(seats) && seats >= 0 && seats <= 2147483647
      ? seats >= 50 ? 100 : seats >= 35 ? 90 : seats >= 25 ? 80 : seats >= 15 ? 65 : seats >= 8 ? 50 : 35 : null,
  };
  const components: MatchResult["components"] = {};
  let totalWeight = 0, total = 0;
  for (const factor of Object.keys(base) as Factor[]) {
    const compatibility = values[factor];
    if (compatibility === null) continue;
    totalWeight += weights[factor]; total += compatibility * weights[factor];
    components[factor] = { compatibility, weight: weights[factor], contribution: 0 };
  }
  if (!totalWeight) return null;
  for (const component of Object.values(components)) component.contribution = component.compatibility * component.weight / totalWeight;
  const labels: Partial<Record<Factor, string>> = {
    wifi: cafe.wifi === "Great WiFi" ? "Great Wi-Fi" : "Good Wi-Fi",
    seating: cafe.seating === "Comfortable" ? "Comfortable seating" : undefined,
    sockets: cafe.sockets === "Plenty" ? "Plenty of sockets" : undefined,
    coffee: cafe.coffee === "Excellent" ? "Excellent coffee" : "Good coffee",
    noise: cafe.noise === "Quiet" ? "Quiet atmosphere" : cafe.noise === "Moderate" ? "Moderate background noise" : undefined,
    busyness: cafe.busyness === "Quiet" ? "A calmer cafe" : cafe.busyness === "Moderate" ? "A balanced buzz" : undefined,
    seatCount: seats != null && seats >= 25 ? session === "long" ? "Good space for longer sessions" : "Good amount of space" : undefined,
  };
  const reasons = (Object.keys(components) as Factor[])
    .filter(key => components[key]!.compatibility >= 75 && labels[key])
    .sort((a, b) => components[b]!.contribution - components[a]!.contribution)
    .slice(0, 3).map(key => labels[key]!);
  return { score: Math.max(0, Math.min(100, Math.round(total / totalWeight))), components, reasons };
}
export function rankCafes(cafes: Cafe[], matches: ReadonlyMap<Cafe, MatchResult>) {
  return [...cafes].sort((a, b) => (matches.get(b)?.score ?? -1) - (matches.get(a)?.score ?? -1) || b.studyScore - a.studyScore);
}
