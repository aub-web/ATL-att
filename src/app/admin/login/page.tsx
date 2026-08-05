import LoginForm from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
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
