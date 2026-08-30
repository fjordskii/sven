export const DEFAULT_TZ = "America/New_York";

export function journalTimeZone(): string {
  return process.env.JOURNAL_TZ?.trim() || DEFAULT_TZ;
}

/** Calendar date in `tz` as YYYY-MM-DD. */
export function dateInZone(now: Date = new Date(), tz: string = journalTimeZone()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = Date.UTC(year, month - 1, day) + days * 86_400_000;
  const next = new Date(utc);
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function formatDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const monthName = months[month - 1];
  if (!year || !monthName || !day) return iso;
  return `${day} ${monthName} ${year}`;
}

export function formatWeekday(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "";
  const utc = new Date(Date.UTC(year, month - 1, day));
  return weekdays[utc.getUTCDay()] ?? "";
}

export function formatStamp(
  iso: string,
  tz: string = journalTimeZone(),
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
