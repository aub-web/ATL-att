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
