type CafeIdentity = { id?: string; slug?: string; name: string };

export function cafeLinkKey(cafe: CafeIdentity): string {
  return cafe.slug || cafe.id || cafe.name;
}

export function cafeShareUrl(cafe: CafeIdentity, origin: string): string {
  const url = new URL("/", origin);
  url.searchParams.set("cafe", cafeLinkKey(cafe));
  return url.href;
}

export function cafeDirections(cafe: { name: string; address?: string; city: string; coords?: readonly number[] | null }) {
  const [longitude, latitude] = cafe.coords ?? [];
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  // Existing cafe records have no street address; the city disambiguates names.
  const destination = hasCoordinates ? `${latitude},${longitude}` : `${cafe.name}, ${cafe.address || cafe.city}`;
  return {
    hasCoordinates,
    apple: `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}`,
    google: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`,
  };
}
