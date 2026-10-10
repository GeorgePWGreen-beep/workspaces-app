import { CITY_STORAGE_KEY, NEARBY_GUIDANCE_KEY, isCity, type City } from "./cities";
import { validPreferences, type StudyPreferences } from "../types/studyPreferences";

export const ONBOARDING_COMPLETE_KEY = "hot-seats.onboarding-complete.v1";
export const ONBOARDING_STARTED_KEY = "hot-seats.onboarding-started.v1";
export const GUEST_PREFERENCES_KEY = "hot-seats.guest-study-preferences.v1";
type StorageReader = Pick<Storage, "getItem">;

export const FEATURE_INTRODUCTION_KEYS = {
  studyScore: "hot-seats.study-score-introduction.v1",
  match: "hot-seats.match-introduction.v1",
} as const;
export const PROGRESSIVE_ONBOARDING_KEY = "hot-seats.progressive-onboarding.v1";
export type FeatureIntroduction = keyof typeof FEATURE_INTRODUCTION_KEYS;
export type FeatureIntroductionState = Record<FeatureIntroduction, boolean>;

/** Enrol only new visitors. Existing users do not get a new tutorial on rollout.
 * Once enrolled, unfinished introductions can be encountered on a later visit. */
export function initializeFeatureIntroductions(storage: StorageReader & Pick<Storage, "setItem" | "removeItem">,
  returning: boolean, reset = false): FeatureIntroductionState {
  if (reset) {
    for (const key of Object.values(FEATURE_INTRODUCTION_KEYS)) storage.removeItem(key);
  }
  if (!reset && returning && storage.getItem(PROGRESSIVE_ONBOARDING_KEY) !== "started") {
    return { studyScore: true, match: true };
  }
  const completed = {
    studyScore: storage.getItem(FEATURE_INTRODUCTION_KEYS.studyScore) === "seen",
    match: storage.getItem(FEATURE_INTRODUCTION_KEYS.match) === "seen",
  };
  // A full storage quota must not discard completion flags we could still read.
  try { storage.setItem(PROGRESSIVE_ONBOARDING_KEY, "started"); } catch { /* Keep the readable state for this visit. */ }
  return completed;
}

export function completeFeatureIntroduction(storage: Pick<Storage, "setItem">, feature: FeatureIntroduction): void {
  storage.setItem(FEATURE_INTRODUCTION_KEYS[feature], "seen");
}

export function readGuestPreferences(storage: StorageReader): StudyPreferences | null {
  try {
    const value: unknown = JSON.parse(storage.getItem(GUEST_PREFERENCES_KEY) ?? "null");
    if (!validPreferences(value)) return null;
    // Keep the same strict payload as the private database table.
    return { atmosphere_preference: value.atmosphere_preference, session_length: value.session_length, priorities: [...value.priorities] };
  } catch { return null; }
}

export function readOnboardingState(storage: StorageReader) {
  const city = storage.getItem(CITY_STORAGE_KEY);
  const complete = storage.getItem(ONBOARDING_COMPLETE_KEY) === "true";
  const started = storage.getItem(ONBOARDING_STARTED_KEY) === "true";
  const nearbySeen = storage.getItem(NEARBY_GUIDANCE_KEY) === "seen";
  // A city saved by an unfinished new flow must not be mistaken for a legacy user.
  const legacy = !complete && !started && (isCity(city) || nearbySeen || readGuestPreferences(storage) !== null);
  return { city: isCity(city) ? city : null, complete: complete || nearbySeen || legacy, nearbySeen: nearbySeen || complete || legacy };
}

/** Start on the map without a city gate; preserve explicit choices, even if empty. */
export function initialBrowseCity(savedCity: City | null, availableCities: readonly City[]): City {
  return savedCity ?? (availableCities.includes("Exeter") ? "Exeter" : availableCities[0] ?? "Exeter");
}

/** Completing or skipping the welcome flow also retires the old Nearby cue. */
export function completeOnboarding(storage: Pick<Storage, "setItem" | "removeItem">): void {
  storage.setItem(NEARBY_GUIDANCE_KEY, "seen");
  storage.setItem(ONBOARDING_COMPLETE_KEY, "true");
  storage.removeItem(ONBOARDING_STARTED_KEY);
}

/** Kept for older test/tools callers; the Nearby reveal is no longer mounted. */
export const completeNearbyIntroduction = completeOnboarding;

/** Development-only caller; preserve the user's city and study preferences. */
export function resetOnboarding(storage: Pick<Storage, "setItem" | "removeItem">): void {
  storage.setItem(ONBOARDING_STARTED_KEY, "true");
  storage.removeItem(ONBOARDING_COMPLETE_KEY);
  storage.removeItem(NEARBY_GUIDANCE_KEY);
}

export function togglePriority<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter(item => item !== value) : values.length < 3 ? [...values, value] : values;
}
