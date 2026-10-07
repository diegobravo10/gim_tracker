import type { WorkoutSet } from '../api/types.ts';
import { formatWeight } from '../lib/formatters.ts';
import { Stepper } from './Stepper.tsx';

const WEIGHT_STEP = 2.5;
const REPS_STEP = 1;

interface SetRowProps {
  set: WorkoutSet;
  onChangeWeight: (weightKg: number) => void;
  onChangeReps: (reps: number) => void;
  onToggleCompleted: () => void;
  onDelete: () => void;
}

export function SetRow({
  set,
  onChangeWeight,
  onChangeReps,
  onToggleCompleted,
  onDelete,
}: SetRowProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-neutral-900 p-2">
      <div className="flex items-center justify-center gap-4">
        <Stepper
          label="kg"
          value={formatWeight(set.weightKg)}
          onDecrement={() => onChangeWeight(Math.max(0, set.weightKg - WEIGHT_STEP))}
          onIncrement={() => onChangeWeight(set.weightKg + WEIGHT_STEP)}
        />
        <Stepper
          label="reps"
          value={String(set.reps)}
          onDecrement={() => onChangeReps(Math.max(0, set.reps - REPS_STEP))}
          onIncrement={() => onChangeReps(set.reps + REPS_STEP)}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleCompleted}
          aria-label={set.completed ? 'Desmarcar serie' : 'Marcar serie completada'}
          aria-pressed={set.completed}
          className={`flex h-12 flex-1 items-center justify-center rounded-lg text-xl font-bold ${
            set.completed
              ? 'bg-emerald-500 text-neutral-950'
              : 'bg-neutral-800 text-neutral-500 active:bg-neutral-700'
          }`}
        >
          ✓
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Eliminar serie"
          className="flex h-12 w-12 items-center justify-center text-lg text-neutral-500 active:text-neutral-300"
        >
          ×
        </button>
      </div>
    </div>
  );
}
