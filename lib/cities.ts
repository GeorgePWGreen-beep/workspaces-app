export const CITIES = ["Exeter", "Cambridge"] as const;
export type City = (typeof CITIES)[number];

export const CITY_CONFIG: Record<City, { center: [number, number]; timeZone: string }> = {
  Exeter: { center: [-3.5339, 50.7225], timeZone: "Europe/London" },
  Cambridge: { center: [0.1218, 52.2053], timeZone: "Europe/London" },
};

export const CITY_STORAGE_KEY = "hot-seats.city.v1";
export const NEARBY_GUIDANCE_KEY = "hot-seats.nearby-guidance.v1";

export function isCity(value: unknown): value is City {
  return CITIES.some((city) => city === value);
}

// Verified against public cafe records on 10 September 2026. This is only
// a rollout bridge for rows fetched before the city migration is applied.
export function getLegacyCity(slug: string, latitude: number, longitude: number): City | null {
  const cambridgeSlugs = ["aromi", "bould-brothers-coffee", "espresso-library", "fitzbillies", "hot-numbers", "urban-larder"];
  if (cambridgeSlugs.includes(slug) && latitude >= 52.18 && latitude <= 52.24 && longitude >= 0.08 && longitude <= 0.17) return "Cambridge";
  if (slug === "arrietty" && latitude >= 50.69 && latitude <= 50.76 && longitude >= -3.57 && longitude <= -3.48) return "Exeter";
  return null;
}
