import Link from "next/link";
import LoginForm from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="absolute right-4 top-4 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
      >
        Home
      </Link>
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-semibold text-zinc-900">
          Admin Access
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Enter the admin PIN to view and manage attendance.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
