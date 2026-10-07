interface StepperProps {
  label: string;
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
  disabled?: boolean;
}

export function Stepper({ label, value, onDecrement, onIncrement, disabled }: StepperProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-neutral-500">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDecrement}
          disabled={disabled}
          aria-label={`Restar ${label}`}
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-800 text-xl font-semibold text-neutral-100 active:bg-neutral-700 disabled:opacity-40"
        >
          −
        </button>
        <span className="w-11 text-center text-base font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={disabled}
          aria-label={`Sumar ${label}`}
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-800 text-xl font-semibold text-neutral-100 active:bg-neutral-700 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
