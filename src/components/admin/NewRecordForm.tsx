"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createAttendanceRecord,
  type CreateRecordState,
} from "@/lib/actions/admin-actions";
import DateTimeField from "@/components/admin/DateTimeField";

export default function NewRecordForm({
  employees,
}: {
  employees: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState<
    CreateRecordState,
    FormData
  >(createAttendanceRecord, null);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label
          htmlFor="employeeId"
          className="block text-sm font-medium text-zinc-700"
        >
          Employee
        </label>
        <select
          id="employeeId"
          name="employeeId"
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        >
          <option value="">Select employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="date"
          className="block text-sm font-medium text-zinc-700"
        >
          Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <DateTimeField label="Clock In" name="clockIn" />
      <DateTimeField label="Lunch Start" name="lunchStart" />
      <DateTimeField label="Lunch End" name="lunchEnd" />
      <DateTimeField label="Clock Out" name="clockOut" />

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isPending ? "Creating…" : "Create Record"}
        </button>
        <Link
          href="/admin"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
