import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listAttendanceRecords } from "@/lib/admin-data";
import { formatDate, formatTime } from "@/lib/date";
import { computeTotalHours, formatHours } from "@/lib/attendance";

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

  const sorted = [...records].sort((a, b) => {
    const byDate = a.date.getTime() - b.date.getTime();
    return byDate !== 0 ? byDate : a.employee.name.localeCompare(b.employee.name);
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

  const rows = sorted.map((record) => [
    formatDate(record.date),
    record.employee.name,
    formatTime(record.clockIn),
    formatTime(record.lunchStart),
    formatTime(record.lunchEnd),
    formatTime(record.clockOut),
    formatHours(computeTotalHours(record)),
  ]);

  const csv = [header, ...rows]
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
