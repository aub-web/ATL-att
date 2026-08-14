import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import SidebarNav from "@/components/admin/SidebarNav";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div className="flex flex-1">
      <SidebarNav />
      <main className="min-w-0 flex-1 overflow-x-auto px-4 py-6 sm:px-8">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
