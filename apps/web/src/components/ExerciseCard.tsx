import type { WorkoutExercise } from '../api/types.ts';
import { RestDurationControl } from './RestDurationControl.tsx';
import { SetRow } from './SetRow.tsx';

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  lastTimeSummary?: string | null;
  onAddSet: () => void;
  onDeleteSet: (setId: string) => void;
  onChangeSetWeight: (setId: string, weightKg: number) => void;
  onChangeSetReps: (setId: string, reps: number) => void;
  onToggleSetCompleted: (setId: string) => void;
  onDeleteExercise: () => void;
}

export function ExerciseCard({
  workoutExercise,
  lastTimeSummary,
  onAddSet,
  onDeleteSet,
  onChangeSetWeight,
  onChangeSetReps,
  onToggleSetCompleted,
  onDeleteExercise,
}: ExerciseCardProps) {
  return (
    <section className="rounded-2xl bg-neutral-900/40 p-3">
      <header className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold">{workoutExercise.exercise.name}</h3>
          {lastTimeSummary && (
            <p className="text-sm text-neutral-500">Última vez: {lastTimeSummary}</p>
          )}
          <div className="mt-1">
            <RestDurationControl exerciseId={workoutExercise.exerciseId} />
          </div>
        </div>
        <button
          type="button"
          onClick={onDeleteExercise}
          aria-label="Quitar ejercicio"
          className="flex h-10 w-10 items-center justify-center text-neutral-500 active:text-neutral-300"
        >
          ×
        </button>
      </header>

      <div className="flex flex-col gap-2">
        {workoutExercise.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            onChangeWeight={(weightKg) => onChangeSetWeight(set.id, weightKg)}
            onChangeReps={(reps) => onChangeSetReps(set.id, reps)}
            onToggleCompleted={() => onToggleSetCompleted(set.id)}
            onDelete={() => onDeleteSet(set.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAddSet}
        className="mt-2 w-full rounded-lg border border-neutral-700 py-3 text-sm font-medium text-neutral-300 active:bg-neutral-800"
        style={{ minHeight: 48 }}
      >
        + serie
      </button>
    </section>
  );
}
