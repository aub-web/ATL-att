"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import {
  createEmployeePin,
  getEmployeeAuthStatus,
  getTodayRecord,
  punchAttendance,
  verifyEmployeePin,
  type EmployeeOption,
} from "@/lib/actions/employee-actions";
import {
  PUNCH_ACTIONS,
  PUNCH_ACTION_LABELS,
  canPerformAction,
  type PunchAction,
} from "@/lib/attendance";
import { formatDate, formatTime, isLateClockIn } from "@/lib/date";

type AttendanceRecordData = Awaited<ReturnType<typeof getTodayRecord>>;

const STORAGE_KEY = "ob-attendance:employee";

type Step = "select-name" | "create-pin" | "enter-pin" | "dashboard";

export default function EmployeeAttendanceApp({
  employees,
}: {
  employees: EmployeeOption[];
}) {
  const [step, setStep] = useState<Step>("select-name");
  const [employee, setEmployee] = useState<EmployeeOption | null>(null);
  const [record, setRecord] = useState<AttendanceRecordData | null>(null);
  const [loadedForEmployeeId, setLoadedForEmployeeId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as EmployeeOption;
      // Restoring session state from an external store (sessionStorage) on
      // mount, per React's guidance on synchronizing with external systems.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmployee(parsed);
      setStep("dashboard");
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!employee || step !== "dashboard") return;
    let cancelled = false;
    getTodayRecord(employee.id).then((result) => {
      if (cancelled) return;
      setRecord(result);
      setLoadedForEmployeeId(employee.id);
    });
    return () => {
      cancelled = true;
    };
  }, [employee, step]);

  function handleSelectName(selected: EmployeeOption) {
    setError(null);
    setEmployee(selected);
    startTransition(async () => {
      const result = await getEmployeeAuthStatus(selected.id);
      if ("error" in result) {
        setError(result.error);
        setEmployee(null);
        return;
      }
      setStep(result.hasPin ? "enter-pin" : "create-pin");
    });
  }

  function unlock(selected: EmployeeOption) {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    setStep("dashboard");
  }

  function handleCreatePin(pin: string, confirmPin: string) {
    if (!employee) return;
    setError(null);
    startTransition(async () => {
      const result = await createEmployeePin(employee.id, pin, confirmPin);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      unlock(employee);
    });
  }

  function handleEnterPin(pin: string) {
    if (!employee) return;
    setError(null);
    startTransition(async () => {
      const result = await verifyEmployeePin(employee.id, pin);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      unlock(employee);
    });
  }

  function handlePunch(action: PunchAction) {
    if (!employee) return;
    setError(null);
    setConfirmation(null);
    startTransition(async () => {
      const result = await punchAttendance(employee.id, action);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setRecord(result.record);
      setConfirmation(
        `${PUNCH_ACTION_LABELS[action]} recorded at ${formatTime(result.recordedAt)}`,
      );
    });
  }

  function handleSwitchUser() {
    setEmployee(null);
    setRecord(null);
    setLoadedForEmployeeId(null);
    setConfirmation(null);
    setError(null);
    setStep("select-name");
    window.sessionStorage.removeItem(STORAGE_KEY);
  }

  if (step === "select-name" || !employee) {
    return (
      <NamePicker
        employees={employees}
        onSelect={handleSelectName}
        error={error}
        pending={isPending}
      />
    );
  }

  if (step === "create-pin") {
    return (
      <PinSetupForm
        employeeName={employee.name}
        onSubmit={handleCreatePin}
        onBack={handleSwitchUser}
        error={error}
        pending={isPending}
      />
    );
  }

  if (step === "enter-pin") {
    return (
      <PinEntryForm
        employeeName={employee.name}
        onSubmit={handleEnterPin}
        onBack={handleSwitchUser}
        error={error}
        pending={isPending}
      />
    );
  }

  return (
    <AttendanceDashboard
      employee={employee}
      record={record}
      loadingRecord={loadedForEmployeeId !== employee.id}
      confirmation={confirmation}
      error={error}
      pending={isPending}
      onPunch={handlePunch}
      onSignOut={handleSwitchUser}
    />
  );
}

function NamePicker({
  employees,
  onSelect,
  error,
  pending,
}: {
  employees: EmployeeOption[];
  onSelect: (employee: EmployeeOption) => void;
  error: string | null;
  pending: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-semibold text-zinc-900">
          Outbound Attendance
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Tap your name to clock in or out.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {employees.length === 0 ? (
          <p className="mt-8 text-center text-sm text-zinc-500">
            No team members are set up yet. Ask an admin to add the roster.
          </p>
        ) : (
          <div className="mt-8 space-y-2">
            {employees.map((emp) => (
              <button
                key={emp.id}
                type="button"
                disabled={pending}
                onClick={() => onSelect(emp)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-left text-base font-medium text-zinc-900 shadow-sm transition hover:border-zinc-900 disabled:opacity-50"
              >
                {emp.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PinPad({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      data-1p-ignore
      data-lpignore="true"
      autoFocus={autoFocus}
      maxLength={4}
      placeholder="••••"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
      style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
      className="w-full rounded-xl border border-zinc-300 px-4 py-3.5 text-center text-2xl tracking-[0.5em] text-zinc-900 placeholder:tracking-normal placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
    />
  );
}

function PinSetupForm({
  employeeName,
  onSubmit,
  onBack,
  error,
  pending,
}: {
  employeeName: string;
  onSubmit: (pin: string, confirmPin: string) => void;
  onBack: () => void;
  error: string | null;
  pending: boolean;
}) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(pin, confirmPin);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
          ← Back
        </button>
        <h1 className="mt-3 text-2xl font-semibold text-zinc-900">
          Hi, {employeeName.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          First time here — choose a 4-digit PIN to protect your attendance.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              New PIN
            </label>
            <PinPad value={pin} onChange={setPin} autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Confirm PIN
            </label>
            <PinPad value={confirmPin} onChange={setConfirmPin} />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || pin.length !== 4 || confirmPin.length !== 4}
            className="w-full rounded-xl bg-zinc-900 px-4 py-3.5 text-base font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Set PIN & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PinEntryForm({
  employeeName,
  onSubmit,
  onBack,
  error,
  pending,
}: {
  employeeName: string;
  onSubmit: (pin: string) => void;
  onBack: () => void;
  error: string | null;
  pending: boolean;
}) {
  const [pin, setPin] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(pin);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
          ← Back
        </button>
        <h1 className="mt-3 text-2xl font-semibold text-zinc-900">
          Hi, {employeeName.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Enter your PIN to continue.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <PinPad value={pin} onChange={setPin} autoFocus />

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || pin.length !== 4}
            className="w-full rounded-xl bg-zinc-900 px-4 py-3.5 text-base font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {pending ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AttendanceDashboard({
  employee,
  record,
  loadingRecord,
  confirmation,
  error,
  pending,
  onPunch,
  onSignOut,
}: {
  employee: EmployeeOption;
  record: AttendanceRecordData | null;
  loadingRecord: boolean;
  confirmation: string | null;
  error: string | null;
  pending: boolean;
  onPunch: (action: PunchAction) => void;
  onSignOut: () => void;
}) {
  const state = record ?? {
    clockIn: null,
    lunchStart: null,
    lunchEnd: null,
    clockOut: null,
  };
  const late = state.clockIn ? isLateClockIn(new Date(state.clockIn)) : false;

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500">{formatDate(new Date())}</p>
            <h1 className="text-xl font-semibold text-zinc-900">
              Hi, {employee.name.split(" ")[0]}
            </h1>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-1 text-sm font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
          >
            Not you?
          </button>
        </div>

        {confirmation && (
          <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {confirmation}
          </p>
        )}
        {error && (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          {PUNCH_ACTIONS.map((action) => {
            const enabled = !loadingRecord && !pending && canPerformAction(state, action);
            const timestamp = state[action];
            return (
              <button
                key={action}
                type="button"
                disabled={!enabled}
                onClick={() => onPunch(action)}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-6 text-center shadow-sm transition enabled:hover:border-zinc-900 enabled:hover:shadow disabled:opacity-40"
              >
                <span className="text-sm font-semibold text-zinc-900">
                  {PUNCH_ACTION_LABELS[action]}
                </span>
                <span className="text-xs text-zinc-500">
                  {timestamp ? formatTime(new Date(timestamp)) : "Not yet"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl border border-zinc-200 bg-white">
          <h2 className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900">
            Today&apos;s log
          </h2>
          <dl className="divide-y divide-zinc-100">
            <LogRow
              label="Clock In"
              value={state.clockIn}
              flag={late ? "Late" : null}
            />
            <LogRow label="Lunch Start" value={state.lunchStart} />
            <LogRow label="Lunch End" value={state.lunchEnd} />
            <LogRow label="Clock Out" value={state.clockOut} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function LogRow({
  label,
  value,
  flag,
}: {
  label: string;
  value: Date | string | null;
  flag?: string | null;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="flex items-center gap-2 text-sm font-medium text-zinc-900">
        {flag && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
            {flag}
          </span>
        )}
        {value ? formatTime(new Date(value)) : "—"}
      </dd>
    </div>
  );
}
