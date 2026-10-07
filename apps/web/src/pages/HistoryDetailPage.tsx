import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import * as workoutsApi from '../api/workouts.ts';
import type { Exercise, WorkoutExercise } from '../api/types.ts';
import { AddExerciseSheet } from '../components/AddExerciseSheet.tsx';
import { ExerciseCard } from '../components/ExerciseCard.tsx';
import { useWorkoutActions } from '../hooks/useWorkoutActions.ts';
import { formatArrivalTime, formatDate, formatDuration } from '../lib/formatters.ts';
import { useState } from 'react';

export function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAddExercise, setShowAddExercise] = useState(false);

  const queryKey = ['workout', id];

  const { data: workout, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => workoutsApi.getWorkout(id!),
    enabled: !!id,
  });

  const actions = useWorkoutActions(queryKey);

  function handleSelectExercise(exercise: Exercise) {
    setShowAddExercise(false);
    if (!workout) return;
    actions.addExercise(workout.id, exercise);
  }

  function handleAddSet(workoutExercise: WorkoutExercise) {
    const previous = workoutExercise.sets.at(-1);
    actions.addSet(workoutExercise.id, {
      weightKg: previous?.weightKg ?? 0,
      reps: previous?.reps ?? 0,
    });
  }

  if (isLoading) {
    return <p className="pt-16 text-center text-neutral-500">Cargando...</p>;
  }

  if (isError || !workout) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16">
        <p className="text-neutral-400">No se encontró el entreno.</p>
        <button
          type="button"
          onClick={() => navigate('/historial')}
          className="rounded-lg bg-neutral-800 px-4 py-3 font-medium"
          style={{ minHeight: 48 }}
        >
          Volver al historial
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => navigate('/historial')}
        className="text-sm text-neutral-400"
      >
        ← Historial
      </button>

      <div>
        <h1 className="text-lg font-bold">{formatDate(workout.startedAt)}</h1>
        <p className="text-neutral-400">
          Llegada {formatArrivalTime(workout.startedAt)} ·{' '}
          {formatDuration(workout.startedAt, workout.finishedAt)} ·{' '}
          {workout.totalVolumeKg.toLocaleString('es-EC')} kg
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {workout.exercises.map((we) => (
          <ExerciseCard
            key={we.id}
            workoutExercise={we}
            onAddSet={() => handleAddSet(we)}
            onDeleteSet={(setId) => actions.deleteSet(setId)}
            onChangeSetWeight={(setId, weightKg) => actions.updateSet(setId, { weightKg })}
            onChangeSetReps={(setId, reps) => actions.updateSet(setId, { reps })}
            onToggleSetCompleted={(setId) => {
              const set = we.sets.find((s) => s.id === setId);
              if (!set) return;
              actions.updateSet(setId, { completed: !set.completed });
            }}
            onDeleteExercise={() => actions.deleteExercise(we.id)}
          />
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

      {showAddExercise && (
        <AddExerciseSheet
          onClose={() => setShowAddExercise(false)}
          onSelect={handleSelectExercise}
        />
      )}
    </div>
  );
}
