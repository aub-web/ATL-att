import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listAttendanceRecords } from "@/lib/admin-data";
import { formatDate, formatTime, isLateClockIn } from "@/lib/date";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  // Middleware already gates /api/admin/*, but route handlers must not rely
  // on that alone — re-verify the session here too.
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const records = await listAttendanceRecords({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    employeeId: searchParams.get("employeeId") ?? undefined,
  });

  const header = [
    "Employee",
    "Email",
    "Date",
    "Clock In",
    "Late",
    "Lunch Start",
    "Lunch End",
    "Clock Out",
  ];

  const rows = records.map((record) => [
    record.employee.name,
    record.employee.email ?? "",
    formatDate(record.date),
    formatTime(record.clockIn),
    record.clockIn && isLateClockIn(record.clockIn) ? "Yes" : "No",
    formatTime(record.lunchStart),
    formatTime(record.lunchEnd),
    formatTime(record.clockOut),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="attendance-export.csv"',
    },
  });
}
