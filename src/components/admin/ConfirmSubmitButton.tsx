"use client";

export default function ConfirmSubmitButton({
  label,
  confirmMessage,
  className,
}: {
  label: string;
  confirmMessage: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={className}
    >
      {label}
    </button>
  );
}
