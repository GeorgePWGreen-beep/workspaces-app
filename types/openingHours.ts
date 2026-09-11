export const WEEKDAYS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** Local 24-hour times. A close earlier than open continues into the next day.
 * 24:00 is allowed only for close. Equal times are invalid; use null for closed. */
export type DailyOpeningHours = { open: string; close: string };
/** All seven days are required; null means closed, not unknown. */
export type WeeklyOpeningHours = Record<Weekday, DailyOpeningHours | null>;
