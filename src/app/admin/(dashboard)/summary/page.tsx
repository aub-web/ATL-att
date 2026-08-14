import { listAttendanceRecords, listEmployees } from "@/lib/admin-data";
import { formatDate, formatTime } from "@/lib/date";
import { computeTotalHours, formatHours } from "@/lib/attendance";

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

export default async function AdminSummaryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [employees, records] = await Promise.all([
    listEmployees(),
    listAttendanceRecords(params),
  ]);

  const queryString = buildQueryString(params);

  const sorted = [...records].sort((a, b) => {
    const byDate = a.date.getTime() - b.date.getTime();
    return byDate !== 0 ? byDate : a.employee.name.localeCompare(b.employee.name);
  });

  const groups = new Map<number, typeof sorted>();
  for (const record of sorted) {
    const key = record.date.getTime();
    const group = groups.get(key);
    if (group) {
      group.push(record);
    } else {
      groups.set(key, [record]);
    }
  }

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
            defaultValue={params.from ?? ""}
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
            defaultValue={params.to ?? ""}
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

      <div className="mt-6 space-y-6">
        {groups.size === 0 && (
          <p className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500">
            No attendance records match these filters.
          </p>
        )}
        {[...groups.entries()].map(([key, dateRecords]) => (
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
                {dateRecords.map((record) => (
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
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
