import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployee } from "@/lib/admin-data";
import { toDateInputValue } from "@/lib/date";
import EditEmployeeForm from "@/components/admin/EditEmployeeForm";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployee(id);

  if (!employee) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/admin/roster"
        className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        ← Back
      </Link>

      <h1 className="mt-3 text-xl font-semibold text-zinc-900">
        Edit Employee
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        PINs are chosen by employees themselves — use &quot;Reset PIN&quot;
        from the roster table if someone forgets theirs.
      </p>

      <EditEmployeeForm
        employee={{
          id: employee.id,
          name: employee.name,
          email: employee.email,
          endDate: employee.endDate ? toDateInputValue(employee.endDate) : null,
        }}
      />
    </div>
  );
}
