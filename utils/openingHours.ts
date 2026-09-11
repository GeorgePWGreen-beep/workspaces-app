import { WEEKDAYS, type WeeklyOpeningHours } from "../types/openingHours";

const OPEN_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const CLOSE_TIME = /^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/;

export function isWeeklyOpeningHours(value: unknown): value is WeeklyOpeningHours {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const week = value as Record<string, unknown>;
  if (Object.keys(week).length !== 7) return false;
  return WEEKDAYS.every((day) => {
    if (!Object.hasOwn(week, day)) return false;
    const hours = week[day];
    if (hours === null) return true;
    if (!hours || typeof hours !== "object" || Array.isArray(hours)) return false;
    const interval = hours as Record<string, unknown>;
    return Object.keys(interval).length === 2 && typeof interval.open === "string" &&
      typeof interval.close === "string" && OPEN_TIME.test(interval.open) &&
      CLOSE_TIME.test(interval.close) && interval.open !== interval.close;
  });
}

function minutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function getOpeningStatus(week: WeeklyOpeningHours, now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone, weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)!.value;
  const index = WEEKDAYS.indexOf(part("weekday").toLowerCase() as (typeof WEEKDAYS)[number]);
  const currentMinute = Number(part("hour")) * 60 + Number(part("minute"));
  const today = week[WEEKDAYS[index]];
  const yesterday = week[WEEKDAYS[(index + 6) % 7]];

  if (yesterday && minutes(yesterday.close) < minutes(yesterday.open) && currentMinute < minutes(yesterday.close)) {
    return { isOpen: true, label: `Open now · closes ${yesterday.close}` };
  }
  if (today && currentMinute >= minutes(today.open) &&
    (minutes(today.close) < minutes(today.open) || currentMinute < minutes(today.close))) {
    return { isOpen: true, label: `Open now · closes ${today.close}${minutes(today.close) < minutes(today.open) ? " tomorrow" : ""}` };
  }
  if (today && currentMinute < minutes(today.open)) {
    return { isOpen: false, label: `Closed · opens ${today.open} today` };
  }
  for (let offset = 1; offset <= 7; offset++) {
    const day = WEEKDAYS[(index + offset) % 7];
    const next = week[day];
    if (next) {
      const when = offset === 1 ? "tomorrow" : `on ${day[0].toUpperCase()}${day.slice(1)}`;
      return { isOpen: false, label: `Closed · opens ${next.open} ${when}` };
    }
  }
  return { isOpen: false, label: "Closed today" };
}

export function formatVerifiedDate(value: string | null, timeZone: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone }).format(date);
}
