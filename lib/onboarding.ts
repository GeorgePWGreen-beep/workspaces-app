import { CITY_STORAGE_KEY, NEARBY_GUIDANCE_KEY, isCity } from "./cities";
import { validPreferences, type StudyPreferences } from "../types/studyPreferences";

export const ONBOARDING_COMPLETE_KEY = "hot-seats.onboarding-complete.v1";
export const ONBOARDING_STARTED_KEY = "hot-seats.onboarding-started.v1";
export const GUEST_PREFERENCES_KEY = "hot-seats.guest-study-preferences.v1";
type StorageReader = Pick<Storage, "getItem">;

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
  return { city: isCity(city) ? city : null, complete: complete || legacy, nearbySeen: nearbySeen || legacy };
}

export function togglePriority<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter(item => item !== value) : values.length < 3 ? [...values, value] : values;
}
