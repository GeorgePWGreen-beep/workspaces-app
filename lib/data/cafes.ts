import "server-only";

import { cafes as developmentCafes } from "@/data/cafes";
import { createClient } from "@/lib/supabase/server";
import type { Cafe } from "@/types/cafe";
import type { CafeRow } from "@/types/database";

export function mapCafeRowToCafe(row: CafeRow): Cafe {
  return {
    name: row.name,
    studyScore: row.study_score,
    coords: [row.longitude, row.latitude],
    wifi: row.wifi,
    noise: row.noise,
    sockets: row.sockets,
    busyness: row.busyness,
    rating: row.rating,
    price: row.price,
    walkTime: row.walk_time,
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
