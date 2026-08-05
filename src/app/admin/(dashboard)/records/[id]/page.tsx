import Link from "next/link";
import { notFound } from "next/navigation";
import { getAttendanceRecord } from "@/lib/admin-data";
import { updateAttendanceRecord } from "@/lib/actions/admin-actions";
import { formatDate, toDateTimeInputValue } from "@/lib/date";
import DateTimeField from "@/components/admin/DateTimeField";

export default async function EditAttendanceRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const record = await getAttendanceRecord(id);

  if (!record) {
    notFound();
  }

  const backHref = returnTo && returnTo.startsWith("/admin") ? returnTo : "/admin";

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href={backHref}
        className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        ← Back
      </Link>

      <h1 className="mt-3 text-xl font-semibold text-zinc-900">
        Edit Record
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {record.employee.name} · {formatDate(record.date)}
      </p>

      <form action={updateAttendanceRecord} className="mt-6 space-y-4">
        <input type="hidden" name="id" value={record.id} />
        <input type="hidden" name="returnTo" value={backHref} />

        <DateTimeField
          label="Clock In"
          name="clockIn"
          defaultValue={
            record.clockIn ? toDateTimeInputValue(record.clockIn) : ""
          }
        />
        <DateTimeField
          label="Lunch Start"
          name="lunchStart"
          defaultValue={
            record.lunchStart ? toDateTimeInputValue(record.lunchStart) : ""
          }
        />
        <DateTimeField
          label="Lunch End"
          name="lunchEnd"
          defaultValue={
            record.lunchEnd ? toDateTimeInputValue(record.lunchEnd) : ""
          }
        />
        <DateTimeField
          label="Clock Out"
          name="clockOut"
          defaultValue={
            record.clockOut ? toDateTimeInputValue(record.clockOut) : ""
          }
        />

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save Changes
          </button>
          <Link
            href={backHref}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
