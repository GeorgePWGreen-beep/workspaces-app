import type { Cafe } from "../types/cafe";

type ScoringCategory = "wifi" | "noise" | "seating" | "sockets" | "coffee" | "busyness";

/** Universal quality inputs only. Availability, location and preferences are separate. */
export type StudyScoreInputs = {
  [K in ScoringCategory]?: Cafe[K] | null;
} & { seatCount?: number | null };

/** Mirror of public.calculate_study_score_v1; SQL/TypeScript parity is tested. */
export const STUDY_SCORE_V1_POINTS = {
  wifi: { "Great WiFi": 18, "Good WiFi": 13.5, "Okay WiFi": 8 },
  noise: { Quiet: 15, Moderate: 10, Loud: 3 },
  seating: { Comfortable: 15, Average: 10, Basic: 4 },
  sockets: { Plenty: 15, Some: 10, Few: 4 },
  coffee: { Excellent: 13, Good: 9, Basic: 4 },
  busyness: { Quiet: 12, Moderate: 10, Busy: 5 },
} as const satisfies { [K in ScoringCategory]: Record<Cafe[K], number> };

export const STUDY_SCORE_V1_SEAT_BANDS = [
  { minimum: 50, points: 12 },
  { minimum: 35, points: 10 },
  { minimum: 25, points: 8 },
  { minimum: 15, points: 6 },
  { minimum: 8, points: 4 },
  { minimum: 0, points: 2 },
] as const;

export type StudyScoreBreakdown = {
  total: number;
  rawTotal: number;
  components: Record<ScoringCategory | "seats", number>;
};

function categoryPoints(points: Readonly<Record<string, number>>, value: unknown): number | null {
  return typeof value === "string" && Object.hasOwn(points, value) ? points[value] : null;
}

/** Missing/invalid inputs are unavailable, never zero or a guessed capacity. */
export function getStudyScoreBreakdown(inputs: StudyScoreInputs): StudyScoreBreakdown | null {
  const seats = inputs.seatCount;
  // Match the non-negative PostgreSQL integer domain, including a real zero.
  if (typeof seats !== "number" || !Number.isInteger(seats) || seats < 0 || seats > 2_147_483_647) return null;

  const wifi = categoryPoints(STUDY_SCORE_V1_POINTS.wifi, inputs.wifi);
  const noise = categoryPoints(STUDY_SCORE_V1_POINTS.noise, inputs.noise);
  const seating = categoryPoints(STUDY_SCORE_V1_POINTS.seating, inputs.seating);
  const sockets = categoryPoints(STUDY_SCORE_V1_POINTS.sockets, inputs.sockets);
  const coffee = categoryPoints(STUDY_SCORE_V1_POINTS.coffee, inputs.coffee);
  const busyness = categoryPoints(STUDY_SCORE_V1_POINTS.busyness, inputs.busyness);
  if (wifi === null || noise === null || seating === null || sockets === null || coffee === null || busyness === null) return null;

  const components = {
    wifi, noise, seating, sockets, coffee, busyness,
    seats: STUDY_SCORE_V1_SEAT_BANDS.find((band) => seats >= band.minimum)!.points,
  };
  const rawTotal = Object.values(components).reduce((sum, points) => sum + points, 0);
  return { total: Math.round(rawTotal), rawTotal, components };
}

export function calculateStudyScore(inputs: StudyScoreInputs): number | null {
  return getStudyScoreBreakdown(inputs)?.total ?? null;
}
