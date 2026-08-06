// All attendance times are anchored to Philippine time (Asia/Manila, UTC+8,
// no DST) regardless of where the server actually runs — Netlify's build
// region isn't PHT, so relying on the runtime's local clock would misdate
// early-morning punches and misjudge lateness.
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const MANILA_TIME_ZONE = "Asia/Manila";

// Team covers two shifts (8:00 AM-5:00 PM and 9:00 AM-6:00 PM PHT). Rather
// than track a per-employee shift, clock-ins are flagged late past a single
// shared grace cutoff that covers both start times.
export const SHIFT_START_HOUR = 10;
export const SHIFT_START_MINUTE = 0;

/** { year, month (0-11), day, hours, minutes } of `date` as Manila wall-clock time. */
function toManilaParts(date: Date) {
  const shifted = new Date(date.getTime() + MANILA_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
  };
}

/** The UTC instant corresponding to a given Manila wall-clock date/time. */
function fromManilaParts(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
): Date {
  return new Date(Date.UTC(year, month, day, hours, minutes) - MANILA_OFFSET_MS);
}

/** Manila midnight for the given instant, used as the AttendanceRecord.date key. */
export function startOfDay(date: Date = new Date()): Date {
  const { year, month, day } = toManilaParts(date);
  return fromManilaParts(year, month, day);
}

/** True if the given clock-in timestamp is after the shift start cutoff (Manila time). */
export function isLateClockIn(clockIn: Date): boolean {
  const { hours, minutes } = toManilaParts(clockIn);
  return (
    hours > SHIFT_START_HOUR ||
    (hours === SHIFT_START_HOUR && minutes > SHIFT_START_MINUTE)
  );
}

/** Format a timestamp as "8:05 AM" in Philippine time, or a placeholder if not recorded. */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: MANILA_TIME_ZONE,
  });
}

/** Format a date as "Aug 5, 2026" in Philippine time. */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: MANILA_TIME_ZONE,
  });
}

/** Format a date as "yyyy-MM-dd" (Manila time) for <input type="date"> values. */
export function toDateInputValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const { year, month, day } = toManilaParts(d);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Parse a "yyyy-MM-dd" input value (interpreted as Manila time) into its UTC instant. */
export function parseDateInputValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return fromManilaParts(year, month - 1, day);
}

/** Format a Date/timestamp as a value for <input type="datetime-local"> (Manila time). */
export function toDateTimeInputValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const { year, month, day, hours, minutes } = toManilaParts(d);
  const datePart = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const timePart = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return `${datePart}T${timePart}`;
}

/** Parse a "yyyy-MM-ddTHH:mm" <input type="datetime-local"> value (interpreted as Manila time) into its UTC instant. */
export function parseDateTimeInputValue(value: string): Date {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  return fromManilaParts(year, month - 1, day, hours, minutes);
}
