import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  listAbsences,
  listAttendanceRecords,
  type Absence,
} from "@/lib/admin-data";
import { formatDate, formatTime, parseDateInputValue, toDateInputValue } from "@/lib/date";
import { computeTotalHours, formatHours } from "@/lib/attendance";
import type { AttendanceRecord, Employee } from "@/generated/prisma/client";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

type RecordWithEmployee = AttendanceRecord & { employee: Employee };
type Row =
  | { kind: "record"; key: string; record: RecordWithEmployee }
  | { kind: "absent"; key: string; absence: Absence };

/** "yyyy-MM-01" for the Manila calendar month containing `date`. */
function startOfMonthKey(date: Date): string {
  const [year, month] = toDateInputValue(date).split("-");
  return `${year}-${month}-01`;
}

export async function GET(request: NextRequest) {
  // Middleware already gates /api/admin/*, but route handlers must not rely
  // on that alone — re-verify the session here too.
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const employeeId = searchParams.get("employeeId") ?? undefined;
  const todayKey = toDateInputValue(new Date());
  const from = searchParams.get("from") ?? startOfMonthKey(new Date());
  const to = searchParams.get("to") ?? todayKey;

  const [records, absences] = await Promise.all([
    listAttendanceRecords({ from, to, employeeId }),
    listAbsences({ from, to, employeeId }),
  ]);

  const rows: Row[] = [
    ...records.map((record): Row => ({
      kind: "record",
      key: toDateInputValue(record.date),
      record,
    })),
    ...absences.map((absence): Row => ({
      kind: "absent",
      key: absence.date,
      absence,
    })),
  ];

  const nameOf = (row: Row) =>
    row.kind === "record" ? row.record.employee.name : row.absence.employeeName;
  rows.sort((a, b) => {
    const byDate = a.key.localeCompare(b.key);
    return byDate !== 0 ? byDate : nameOf(a).localeCompare(nameOf(b));
  });

  const header = [
    "Date",
    "Name",
    "Time In",
    "Lunch Out",
    "Lunch In",
    "Time Out",
    "Total of Hours",
  ];

  const csvRows = rows.map((row) => {
    if (row.kind === "absent") {
      return [
        formatDate(parseDateInputValue(row.absence.date)),
        row.absence.employeeName,
        "Absent",
        "",
        "",
        "",
        "",
      ];
    }
    const { record } = row;
    return [
      formatDate(record.date),
      record.employee.name,
      formatTime(record.clockIn),
      formatTime(record.lunchStart),
      formatTime(record.lunchEnd),
      formatTime(record.clockOut),
      formatHours(computeTotalHours(record)),
    ];
  });

  const csv = [header, ...csvRows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="attendance-summary.csv"',
    },
  });
}
