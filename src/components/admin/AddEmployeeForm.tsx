"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  addEmployee,
  type AddEmployeeState,
} from "@/lib/actions/admin-actions";

export default function AddEmployeeForm() {
  const [state, formAction, isPending] = useActionState<
    AddEmployeeState,
    FormData
  >(addEmployee, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4"
    >
      <div>
        <label htmlFor="name" className="block text-xs font-medium text-zinc-500">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Jamie Fox"
          className="mt-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-xs font-medium text-zinc-500">
          Email (optional)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="jamie@company.com"
          className="mt-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {isPending ? "Adding…" : "Add Employee"}
      </button>
      {state?.error && (
        <p className="w-full text-sm text-red-700">{state.error}</p>
      )}
    </form>
  );
}
