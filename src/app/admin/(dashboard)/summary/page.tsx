import {
  listAbsences,
  listAttendanceRecords,
  listEmployees,
  type Absence,
} from "@/lib/admin-data";
import { formatDate, formatTime, parseDateInputValue, toDateInputValue } from "@/lib/date";
import { computeTotalHours, formatHours } from "@/lib/attendance";
import type { AttendanceRecord, Employee } from "@/generated/prisma/client";

interface SearchParams {
  from?: string;
  to?: string;
  employeeId?: string;
}

function buildQueryString(params: SearchParams): string {
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.employeeId) search.set("employeeId", params.employeeId);
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** "yyyy-MM-01" for the Manila calendar month containing `date`. */
function startOfMonthKey(date: Date): string {
  const [year, month] = toDateInputValue(date).split("-");
  return `${year}-${month}-01`;
}

type RecordWithEmployee = AttendanceRecord & { employee: Employee };
type Row =
  | { kind: "record"; key: string; record: RecordWithEmployee }
  | { kind: "absent"; key: string; absence: Absence };

export default async function AdminSummaryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const todayKey = toDateInputValue(new Date());
  const from = params.from ?? startOfMonthKey(new Date());
  const to = params.to ?? todayKey;

  const [employees, records, absences] = await Promise.all([
    listEmployees(),
    listAttendanceRecords({ ...params, from, to }),
    listAbsences({ from, to, employeeId: params.employeeId }),
  ]);

  const queryString = buildQueryString(params);

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

  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const group = groups.get(row.key);
    if (group) group.push(row);
    else groups.set(row.key, [row]);
  }

  const absenceCounts = new Map<string, number>();
  for (const employee of employees) absenceCounts.set(employee.id, 0);
  for (const absence of absences) {
    absenceCounts.set(
      absence.employeeId,
      (absenceCounts.get(absence.employeeId) ?? 0) + 1,
    );
  }
  const maxAbsences = Math.max(1, ...absenceCounts.values());

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-zinc-900">Summary</h1>
        <a
          href={`/api/admin/export-summary${queryString}`}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Export CSV
        </a>
      </div>

      <form
        method="GET"
        action="/admin/summary"
        className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4"
      >
        <div>
          <label className="block text-xs font-medium text-zinc-500">
            From
          </label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="mt-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500">
            To
          </label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="mt-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500">
            Employee
          </label>
          <select
            name="employeeId"
            defaultValue={params.employeeId ?? ""}
            className="mt-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900"
          >
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Filter
        </button>
        {(params.from || params.to || params.employeeId) && (
          <a
            href="/admin/summary"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
          >
            Reset
          </a>
        )}
      </form>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Absences</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          {formatDate(parseDateInputValue(from))} – {formatDate(parseDateInputValue(to))} · workdays only,
          weekends and Philippine holidays excluded
        </p>

        {absences.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No absences recorded in this range.
          </p>
        ) : (
          <svg
            viewBox={`0 0 600 ${employees.length * 32 + 8}`}
            className="mt-4 w-full"
            role="img"
            aria-label="Absence count per employee"
          >
            {employees.map((employee, i) => {
              const count = absenceCounts.get(employee.id) ?? 0;
              const barMaxWidth = 600 - 160 - 40;
              const barWidth = (count / maxAbsences) * barMaxWidth;
              const y = i * 32;
              return (
                <g key={employee.id}>
                  <text
                    x={0}
                    y={y + 20}
                    className="fill-zinc-600"
                    style={{ font: "12px inherit" }}
                  >
                    {employee.name}
                  </text>
                  <rect
                    x={160}
                    y={y + 8}
                    width={barMaxWidth}
                    height={14}
                    rx={7}
                    className="fill-zinc-100"
                  />
                  {count > 0 && (
                    <rect
                      x={160}
                      y={y + 8}
                      width={Math.max(barWidth, 14)}
                      height={14}
                      rx={7}
                      className="fill-red-500"
                    >
                      <title>{`${employee.name}: ${count} absence${count === 1 ? "" : "s"}`}</title>
                    </rect>
                  )}
                  <text
                    x={160 + barMaxWidth + 8}
                    y={y + 20}
                    className="fill-zinc-900 font-medium"
                    style={{ font: "12px inherit" }}
                  >
                    {count}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <div className="mt-6 space-y-6">
        {groups.size === 0 && (
          <p className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500">
            No attendance records match these filters.
          </p>
        )}
        {[...groups.entries()].map(([key, dateRows]) => (
          <div
            key={key}
            className="overflow-x-auto rounded-xl border border-zinc-200 bg-white"
          >
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Time In</th>
                  <th className="px-4 py-3 font-medium">Lunch Out</th>
                  <th className="px-4 py-3 font-medium">Lunch In</th>
                  <th className="px-4 py-3 font-medium">Time Out</th>
                  <th className="px-4 py-3 font-medium">Total of Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {dateRows.map((row) => {
                  if (row.kind === "absent") {
                    return (
                      <tr
                        key={`absent-${row.absence.employeeId}`}
                        className="bg-red-50"
                      >
                        <td className="px-4 py-3 font-medium text-red-900">
                          {formatDate(parseDateInputValue(row.absence.date))}
                        </td>
                        <td className="px-4 py-3 text-red-900">
                          {row.absence.employeeName}
                        </td>
                        <td
                          colSpan={4}
                          className="px-4 py-3 font-semibold text-red-700"
                        >
                          Absent
                        </td>
                        <td className="px-4 py-3 text-red-700">—</td>
                      </tr>
                    );
                  }
                  const { record } = row;
                  return (
                    <tr key={record.id}>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {record.employee.name}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {formatTime(record.clockIn)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {formatTime(record.lunchStart)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {formatTime(record.lunchEnd)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {formatTime(record.clockOut)}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {formatHours(computeTotalHours(record))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
