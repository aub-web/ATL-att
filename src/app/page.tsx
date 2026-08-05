import Link from "next/link";
import { listEmployeeRoster } from "@/lib/actions/employee-actions";
import EmployeeAttendanceApp from "@/components/employee/EmployeeAttendanceApp";

// Roster changes from /admin should show up immediately for employees.
export const dynamic = "force-dynamic";

export default async function Home() {
  const employees = await listEmployeeRoster();

  return (
    <div className="relative flex flex-1 flex-col bg-zinc-50">
      <Link
        href="/admin"
        className="absolute right-4 top-4 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
      >
        Admin
      </Link>
      <EmployeeAttendanceApp employees={employees} />
    </div>
  );
}
