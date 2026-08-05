// Shift hours: 8:00 AM - 5:00 PM local server time. Clock-ins after this
// hour/minute are flagged late.
export const SHIFT_START_HOUR = 8;
export const SHIFT_START_MINUTE = 0;

/** Midnight (local time) for the given date, used as the AttendanceRecord.date key. */
export function startOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/** True if the given clock-in timestamp is after the shift start time. */
export function isLateClockIn(clockIn: Date): boolean {
  const hours = clockIn.getHours();
  const minutes = clockIn.getMinutes();
  return (
    hours > SHIFT_START_HOUR ||
    (hours === SHIFT_START_HOUR && minutes > SHIFT_START_MINUTE)
  );
}

/** Format a timestamp as "8:05 AM", or a placeholder if not recorded. */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format a date as "Aug 5, 2026". */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format a date as "yyyy-MM-dd" for <input type="date"> values. */
export function toDateInputValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse a "yyyy-MM-dd" input value into a local midnight Date. */
export function parseDateInputValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Format a Date/timestamp as a value for <input type="datetime-local">. */
export function toDateTimeInputValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
