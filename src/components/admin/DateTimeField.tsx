export default function DateTimeField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-zinc-700"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="datetime-local"
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
      />
      <p className="mt-1 text-xs text-zinc-400">Leave blank if not recorded.</p>
    </div>
  );
}
