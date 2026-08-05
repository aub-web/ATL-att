import Link from "next/link";
import { listAttendanceRecords, listEmployees } from "@/lib/admin-data";
import { deleteAttendanceRecord } from "@/lib/actions/admin-actions";
import { formatDate, formatTime, isLateClockIn } from "@/lib/date";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";

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

export default async function AdminDashboardPage({
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
  const returnTo = `/admin${queryString}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-zinc-900">Attendance</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/records/new"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Add Record
          </Link>
          <a
            href={`/api/admin/export${queryString}`}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Export CSV
          </a>
        </div>
      </div>

      <form
        method="GET"
        action="/admin"
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
          <Link
            href="/admin"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
          >
            Reset
          </Link>
        )}
      </form>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Clock In</th>
              <th className="px-4 py-3 font-medium">Lunch Start</th>
              <th className="px-4 py-3 font-medium">Lunch End</th>
              <th className="px-4 py-3 font-medium">Clock Out</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {records.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  No attendance records match these filters.
                </td>
              </tr>
            )}
            {records.map((record) => {
              const late = record.clockIn
                ? isLateClockIn(record.clockIn)
                : false;
              return (
                <tr key={record.id} className="align-top">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {record.employee.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    <div className="flex items-center gap-2">
                      {formatTime(record.clockIn)}
                      {late && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Late
                        </span>
                      )}
                    </div>
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
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/records/${record.id}?returnTo=${encodeURIComponent(returnTo)}`}
                        className="font-medium text-zinc-700 hover:text-zinc-900 hover:underline"
                      >
                        Edit
                      </Link>
                      <form action={deleteAttendanceRecord}>
                        <input type="hidden" name="id" value={record.id} />
                        <input
                          type="hidden"
                          name="returnTo"
                          value={returnTo}
                        />
                        <ConfirmSubmitButton
                          label="Delete"
                          confirmMessage={`Delete ${record.employee.name}'s record for ${formatDate(record.date)}?`}
                          className="font-medium text-red-600 hover:text-red-700 hover:underline"
                        />
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
