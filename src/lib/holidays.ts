// Regular holidays and special (non-working) days for 2026, per Proclamation
// No. 1006 (Presidential Communications Office). Keyed by Manila calendar
// date ("yyyy-MM-dd"). Movable Islamic holidays (Eidul Fitr, Eidul Adha) are
// excluded — their exact dates are only proclaimed once the lunar calendar
// event is confirmed, closer to the date.
export const PH_HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "New Year's Day",
  "2026-02-17": "Chinese New Year",
  "2026-04-02": "Maundy Thursday",
  "2026-04-03": "Good Friday",
  "2026-04-04": "Black Saturday",
  "2026-04-09": "Araw ng Kagitingan",
  "2026-05-01": "Labor Day",
  "2026-06-12": "Independence Day",
  "2026-08-21": "Ninoy Aquino Day",
  "2026-08-31": "National Heroes Day",
  "2026-11-01": "All Saints' Day",
  "2026-11-02": "All Souls' Day",
  "2026-11-30": "Bonifacio Day",
  "2026-12-08": "Feast of the Immaculate Conception of Mary",
  "2026-12-24": "Christmas Eve",
  "2026-12-25": "Christmas Day",
  "2026-12-30": "Rizal Day",
  "2026-12-31": "Last Day of the Year",
};

export function philippineHolidayName(dateKey: string): string | null {
  return PH_HOLIDAYS_2026[dateKey] ?? null;
}

/** True for Mon-Fri dates that aren't a Philippine holiday. `dateKey` is "yyyy-MM-dd" (Manila). */
export function isWorkdayKey(dateKey: string): boolean {
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  if (weekday === 0 || weekday === 6) return false;
  return !(dateKey in PH_HOLIDAYS_2026);
}

/** All workday keys ("yyyy-MM-dd") from `fromKey` to `toKey`, inclusive. */
export function enumerateWorkdayKeys(fromKey: string, toKey: string): string[] {
  const [fy, fm, fd] = fromKey.split("-").map(Number);
  const [ty, tm, td] = toKey.split("-").map(Number);
  const cursor = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);

  const keys: string[] = [];
  while (cursor.getTime() <= end.getTime()) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (isWorkdayKey(key)) keys.push(key);
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}
