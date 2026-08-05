import Link from "next/link";
import { listEmployees } from "@/lib/admin-data";
import NewRecordForm from "@/components/admin/NewRecordForm";

export default async function NewAttendanceRecordPage() {
  const employees = await listEmployees();

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/admin"
        className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        ← Back
      </Link>

      <h1 className="mt-3 text-xl font-semibold text-zinc-900">
        Add Record
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Create a record for an employee who missed a punch, or a day with no
        record yet.
      </p>

      <NewRecordForm employees={employees} />
    </div>
  );
}
