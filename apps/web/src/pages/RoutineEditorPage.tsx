import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createRoutine,
  deleteRoutine,
  getRoutine,
  updateRoutine,
  type SaveRoutineInput,
} from '../api/routines.ts';
import type { Exercise, Routine } from '../api/types.ts';
import { AddExerciseSheet } from '../components/AddExerciseSheet.tsx';
import { Stepper } from '../components/Stepper.tsx';

interface DraftItem {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
}

const DEFAULT_TARGET_SETS = 3;
const DEFAULT_TARGET_REPS = 10;

function toDraftItems(routine: Routine | null): DraftItem[] {
  return (routine?.items ?? []).map((item) => ({
    exerciseId: item.exerciseId,
    exerciseName: item.exercise.name,
    targetSets: item.targetSets ?? DEFAULT_TARGET_SETS,
    targetReps: item.targetReps ?? DEFAULT_TARGET_REPS,
  }));
}

export function RoutineEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'nueva';

  const { data: routine, isLoading } = useQuery({
    queryKey: ['routine', id],
    queryFn: () => getRoutine(id!),
    enabled: !isNew && !!id,
  });

  if (!isNew && isLoading) {
    return <p className="pt-16 text-center text-neutral-500">Cargando...</p>;
  }

  // key fuerza un montaje nuevo (y por lo tanto un estado inicial fresco)
  // cada vez que cambia la rutina cargada, sin necesitar un efecto.
  return <RoutineEditorForm key={id} id={isNew ? undefined : id} routine={isNew ? null : (routine ?? null)} />;
}

function RoutineEditorForm({ id, routine }: { id?: string; routine: Routine | null }) {
  const isNew = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(routine?.name ?? '');
  const [items, setItems] = useState<DraftItem[]>(() => toDraftItems(routine));
  const [showAddExercise, setShowAddExercise] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data: SaveRoutineInput) => (isNew ? createRoutine(data) : updateRoutine(id, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      navigate('/rutinas');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRoutine(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      navigate('/rutinas');
    },
  });

  function handleSelectExercise(exercise: Exercise) {
    setShowAddExercise(false);
    setItems((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        targetSets: DEFAULT_TARGET_SETS,
        targetReps: DEFAULT_TARGET_REPS,
      },
    ]);
  }

  function moveItem(index: number, direction: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function handleSave() {
    saveMutation.mutate({
      name: name.trim(),
      items: items.map((item) => ({
        exerciseId: item.exerciseId,
        targetSets: item.targetSets,
        targetReps: item.targetReps,
      })),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={() => navigate('/rutinas')} className="text-sm text-neutral-400">
        ← Rutinas
      </button>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la rutina"
        className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-base text-neutral-100 placeholder:text-neutral-500"
        style={{ minHeight: 48 }}
      />

      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={`${item.exerciseId}-${index}`} className="rounded-xl bg-neutral-900/60 p-3">
            <div className="mb-2 flex items-start justify-between">
              <p className="font-semibold">{item.exerciseName}</p>
              <button
                type="button"
                onClick={() => removeItem(index)}
                aria-label={`Quitar ${item.exerciseName}`}
                className="flex h-10 w-10 items-center justify-center text-neutral-500 active:text-neutral-300"
              >
                ×
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <Stepper
                  label="series"
                  value={String(item.targetSets)}
                  onDecrement={() =>
                    updateItem(index, { targetSets: Math.max(1, item.targetSets - 1) })
                  }
                  onIncrement={() => updateItem(index, { targetSets: item.targetSets + 1 })}
                />
                <Stepper
                  label="reps"
                  value={String(item.targetReps)}
                  onDecrement={() =>
                    updateItem(index, { targetReps: Math.max(1, item.targetReps - 1) })
                  }
                  onIncrement={() => updateItem(index, { targetReps: item.targetReps + 1 })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  aria-label={`Mover ${item.exerciseName} arriba`}
                  className="flex h-8 w-8 items-center justify-center rounded bg-neutral-800 text-neutral-300 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label={`Mover ${item.exerciseName} abajo`}
                  className="flex h-8 w-8 items-center justify-center rounded bg-neutral-800 text-neutral-300 disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowAddExercise(true)}
        className="w-full rounded-xl border border-neutral-700 py-3 font-medium text-neutral-300 active:bg-neutral-800"
        style={{ minHeight: 48 }}
      >
        + ejercicio
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={!name.trim() || saveMutation.isPending}
        className="w-full rounded-xl bg-emerald-500 py-4 text-lg font-bold text-neutral-950 active:bg-emerald-400 disabled:opacity-60"
        style={{ minHeight: 48 }}
      >
        Guardar
      </button>

      {!isNew && (
        <button
          type="button"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="w-full rounded-xl border border-red-900 py-3 font-medium text-red-400 active:bg-red-950 disabled:opacity-60"
          style={{ minHeight: 48 }}
        >
          Eliminar rutina
        </button>
      )}

      {showAddExercise && (
        <AddExerciseSheet
          onClose={() => setShowAddExercise(false)}
          onSelect={handleSelectExercise}
        />
      )}
    </div>
  );
}
