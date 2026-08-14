"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  updateEmployeeProfile,
  type UpdateEmployeeState,
} from "@/lib/actions/admin-actions";

export default function EditEmployeeForm({
  employee,
}: {
  employee: {
    id: string;
    name: string;
    email: string | null;
    startDate: string | null;
    endDate: string | null;
  };
}) {
  const [state, formAction, isPending] = useActionState<
    UpdateEmployeeState,
    FormData
  >(updateEmployeeProfile, null);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="id" value={employee.id} />

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={employee.name}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
          Email (optional)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={employee.email ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700">
          Start Date (optional)
        </label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={employee.startDate ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
        <p className="mt-1 text-xs text-zinc-500">
          First working day. Before it, they're hidden from the clock-in
          picker and not counted toward absences. Leave blank if unknown.
        </p>
      </div>

      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-zinc-700">
          End Date (optional)
        </label>
        <input
          id="endDate"
          name="endDate"
          type="date"
          defaultValue={employee.endDate ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Last working day. Once set, they drop off the clock-in picker and
          stop counting toward absences — their history is kept. Leave blank
          for active employees.
        </p>
      </div>

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
          {isPending ? "Saving…" : "Save Changes"}
        </button>
        <Link
          href="/admin/roster"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
