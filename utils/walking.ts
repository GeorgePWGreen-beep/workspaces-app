export type Coordinates = { latitude: number; longitude: number };

/** Approximation only: straight-line distance × 1.3, walking at 4.8 km/h.
 * Replace this boundary with a pedestrian-routing provider when available. */
export function estimateWalkMinutes(origin: Coordinates | null, destination: [number, number]): number | null {
  if (!origin) return null;
  const [longitude, latitude] = destination;
  if (![origin.latitude, origin.longitude, latitude, longitude].every(Number.isFinite) ||
    Math.abs(origin.latitude) > 90 || Math.abs(latitude) > 90 ||
    Math.abs(origin.longitude) > 180 || Math.abs(longitude) > 180) return null;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const a = Math.sin(radians(latitude - origin.latitude) / 2) ** 2 +
    Math.cos(radians(origin.latitude)) * Math.cos(radians(latitude)) *
    Math.sin(radians(longitude - origin.longitude) / 2) ** 2;
  const distanceKm = 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
  // Long inter-city journeys are not useful or credible walking estimates.
  if (distanceKm > 10) return null;
  return Math.max(1, Math.round(distanceKm * 1.3 / 4.8 * 60));
}
