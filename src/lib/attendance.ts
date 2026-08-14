export type PunchAction = "clockIn" | "lunchStart" | "lunchEnd" | "clockOut";

export const PUNCH_ACTIONS: PunchAction[] = [
  "clockIn",
  "lunchStart",
  "lunchEnd",
  "clockOut",
];

export const PUNCH_ACTION_LABELS: Record<PunchAction, string> = {
  clockIn: "Clock In",
  lunchStart: "Lunch Start",
  lunchEnd: "Lunch End",
  clockOut: "Clock Out",
};

export interface PunchState {
  clockIn: unknown;
  lunchStart: unknown;
  lunchEnd: unknown;
  clockOut: unknown;
}

/** Whether `action` is currently allowed given today's recorded punches. */
export function canPerformAction(state: PunchState, action: PunchAction): boolean {
  switch (action) {
    case "clockIn":
      return state.clockIn == null;
    case "lunchStart":
      return (
        state.clockIn != null && state.lunchStart == null && state.clockOut == null
      );
    case "lunchEnd":
      return state.lunchStart != null && state.lunchEnd == null;
    case "clockOut":
      return (
        state.clockIn != null &&
        state.clockOut == null &&
        (state.lunchStart == null || state.lunchEnd != null)
      );
  }
}

export interface HoursRecord {
  clockIn: Date | null;
  lunchStart: Date | null;
  lunchEnd: Date | null;
  clockOut: Date | null;
}

/** Hours worked (clock-in to clock-out, minus any lunch break), or null if not yet complete. */
export function computeTotalHours(record: HoursRecord): number | null {
  if (!record.clockIn || !record.clockOut) return null;
  const shiftMs = record.clockOut.getTime() - record.clockIn.getTime();
  const lunchMs =
    record.lunchStart && record.lunchEnd
      ? record.lunchEnd.getTime() - record.lunchStart.getTime()
      : 0;
  return Math.round(((shiftMs - lunchMs) / 3_600_000) * 100) / 100;
}

/** Format hours worked as "8.00", or a placeholder if not yet computable. */
export function formatHours(hours: number | null): string {
  return hours == null ? "—" : hours.toFixed(2);
}
