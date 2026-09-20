export const PRIORITIES = ["wifi", "sockets", "seating", "coffee", "space"] as const;
export type Priority = typeof PRIORITIES[number];
export type StudyPreferences = {
  atmosphere_preference: "quiet" | "balanced" | "lively";
  session_length: "short" | "medium" | "long";
  priorities: Priority[];
};
export type StudyPreferencesRow = StudyPreferences & { user_id: string; created_at: string; updated_at: string };
export function validPreferences(value: unknown): value is StudyPreferences {
  if (!value || typeof value !== "object") return false;
  const p = value as StudyPreferences;
  return ["quiet", "balanced", "lively"].includes(p.atmosphere_preference)
    && ["short", "medium", "long"].includes(p.session_length)
    && Array.isArray(p.priorities) && p.priorities.length <= 3
    && new Set(p.priorities).size === p.priorities.length
    && p.priorities.every(key => PRIORITIES.includes(key));
}
