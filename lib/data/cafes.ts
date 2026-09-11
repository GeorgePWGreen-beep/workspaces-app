import "server-only";

import { cafes as developmentCafes } from "@/data/cafes";
import { createClient } from "@/lib/supabase/server";
import type { Cafe } from "@/types/cafe";
import type { CafeRow } from "@/types/database";
import { getLegacyCity, isCity } from "@/lib/cities";
import { isWeeklyOpeningHours } from "@/utils/openingHours";

export function mapCafeRowToCafe(row: CafeRow): Cafe {
  const city = isCity(row.city) ? row.city : getLegacyCity(row.slug, row.latitude, row.longitude);
  if (!city) throw new Error(`Cafe ${row.slug} needs a verified city. Apply the city migration after reviewing this record.`);
  return {
    city,
    // Missing before the independence migration, or unclassified, stays unknown.
    isIndependent: typeof row.is_independent === "boolean" ? row.is_independent : null,
    seatCount: row.seat_count ?? null,
    lastVerifiedAt: row.last_verified_at ?? null,
    weeklyOpeningHours: isWeeklyOpeningHours(row.weekly_opening_hours) ? row.weekly_opening_hours : null,
    name: row.name,
    // The database maintains v1, retaining the stored score for incomplete rows.
    // Do not recompute here: displays, filters and database ordering must agree.
    studyScore: row.study_score,
    coords: [row.longitude, row.latitude],
    wifi: row.wifi,
    noise: row.noise,
    sockets: row.sockets,
    busyness: row.busyness,
    rating: row.rating,
    price: row.price,
    image: row.image_url,
    description: row.description,
    coffee: row.coffee,
    seating: row.seating,
    openingHours: row.opening_hours,
  };
}

export async function getCafes(): Promise<Cafe[]> {
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  if (!isConfigured) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Supabase is not configured; using the development-only static cafe dataset.",
      );
      return developmentCafes;
    }

    throw new Error("Supabase is not configured.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafes")
    .select("*")
    .eq("is_active", true)
    .order("study_score", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load active cafes from Supabase:", error.message);
    throw new Error("Cafe data could not be loaded.");
  }

  return data.map(mapCafeRowToCafe);
}
