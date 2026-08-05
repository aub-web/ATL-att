import Link from "next/link";
import { listEmployees } from "@/lib/admin-data";
import { removeEmployee, resetEmployeePin } from "@/lib/actions/admin-actions";
import { formatDate } from "@/lib/date";
import AddEmployeeForm from "@/components/admin/AddEmployeeForm";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";

export default async function RosterPage() {
  const employees = await listEmployees();

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900">Team Roster</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Employees pick their own 4-digit PIN the first time they select
        their name on the clock-in page. Reset a PIN here if someone forgets
        it.
      </p>

      <div className="mt-4">
        <AddEmployeeForm />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">PIN</th>
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {employees.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  No employees yet. Add your first team member above.
                </td>
              </tr>
            )}
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {employee.name}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {employee.email ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {employee.pinHash ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      Set
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
                      Not set
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatDate(employee.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/roster/${employee.id}`}
                      className="font-medium text-zinc-700 hover:text-zinc-900 hover:underline"
                    >
                      Edit
                    </Link>
                    {employee.pinHash && (
                      <form action={resetEmployeePin}>
                        <input type="hidden" name="id" value={employee.id} />
                        <ConfirmSubmitButton
                          label="Reset PIN"
                          confirmMessage={`Reset ${employee.name}'s PIN? They'll be asked to choose a new one next time they clock in.`}
                          className="font-medium text-amber-700 hover:text-amber-800 hover:underline"
                        />
                      </form>
                    )}
                    <form action={removeEmployee}>
                      <input type="hidden" name="id" value={employee.id} />
                      <ConfirmSubmitButton
                        label="Remove"
                        confirmMessage={`Remove ${employee.name} from the roster? This also deletes their attendance history.`}
                        className="font-medium text-red-600 hover:text-red-700 hover:underline"
                      />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
