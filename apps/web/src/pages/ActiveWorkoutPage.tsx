import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExerciseLastSets } from '../api/exercises.ts';
import { ApiError } from '../api/client.ts';
import * as workoutsApi from '../api/workouts.ts';
import type { Exercise, LastExerciseSets, WorkoutExercise } from '../api/types.ts';
import { AddExerciseSheet } from '../components/AddExerciseSheet.tsx';
import { ElapsedTimer } from '../components/ElapsedTimer.tsx';
import { ExerciseCard } from '../components/ExerciseCard.tsx';
import { useRestTimer } from '../hooks/useRestTimer.ts';
import { useWorkoutActions } from '../hooks/useWorkoutActions.ts';
import { formatLastTimeSummary } from '../lib/formatters.ts';

const QUERY_KEY = ['workout', 'active'];

async function fetchLastOrNull(exerciseId: string): Promise<LastExerciseSets | null> {
  try {
    return await getExerciseLastSets(exerciseId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export function ActiveWorkoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddExercise, setShowAddExercise] = useState(false);

  const { data: workout, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: workoutsApi.getActiveWorkout,
  });

  const actions = useWorkoutActions(QUERY_KEY);
  const restTimer = useRestTimer();

  const lastDataQueries = useQueries({
    queries: (workout?.exercises ?? []).map((we) => ({
      queryKey: ['exercise-last', we.exerciseId],
      queryFn: () => fetchLastOrNull(we.exerciseId),
      staleTime: Infinity,
    })),
  });

  const finishMutation = useMutation({
    mutationFn: (id: string) => workoutsApi.finishWorkout(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: QUERY_KEY });
      navigate('/historial');
    },
  });

  async function handleSelectExercise(exercise: Exercise) {
    setShowAddExercise(false);
    if (!workout) return;

    const workoutExercise: WorkoutExercise = await actions.addExercise.mutateAsync({
      workoutId: workout.id,
      exerciseId: exercise.id,
    });

    const last = await queryClient.fetchQuery({
      queryKey: ['exercise-last', exercise.id],
      queryFn: () => fetchLastOrNull(exercise.id),
      staleTime: Infinity,
    });

    for (const set of last?.sets ?? []) {
      await actions.addSet.mutateAsync({
        workoutExerciseId: workoutExercise.id,
        data: { weightKg: set.weightKg, reps: set.reps, isWarmup: set.isWarmup },
      });
    }
  }

  function handleAddSet(workoutExercise: WorkoutExercise) {
    const previous = workoutExercise.sets.at(-1);
    actions.addSet.mutate({
      workoutExerciseId: workoutExercise.id,
      data: {
        weightKg: previous?.weightKg ?? 0,
        reps: previous?.reps ?? 0,
      },
    });
  }

  if (isLoading) {
    return <p className="pt-16 text-center text-neutral-500">Cargando...</p>;
  }

  if (isError) {
    const noActive = error instanceof ApiError && error.status === 404;
    return (
      <div className="flex flex-col items-center gap-4 pt-16">
        <p className="text-neutral-400">
          {noActive ? 'No hay un entreno activo.' : 'Ocurrió un error al cargar el entreno.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-lg bg-neutral-800 px-4 py-3 font-medium"
          style={{ minHeight: 48 }}
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  if (!workout) return null;

  return (
    <div className="flex flex-col gap-4">
      <ElapsedTimer startedAt={workout.startedAt} />

      <div className="flex flex-col gap-3">
        {workout.exercises.map((we, index) => {
          const last = lastDataQueries[index]?.data;
          return (
            <ExerciseCard
              key={we.id}
              workoutExercise={we}
              lastTimeSummary={last ? formatLastTimeSummary(last.sets) : null}
              onAddSet={() => handleAddSet(we)}
              onDeleteSet={(setId) => actions.deleteSet.mutate(setId)}
              onChangeSetWeight={(setId, weightKg) =>
                actions.updateSet.mutate({ id: setId, data: { weightKg } })
              }
              onChangeSetReps={(setId, reps) =>
                actions.updateSet.mutate({ id: setId, data: { reps } })
              }
              onToggleSetCompleted={(setId) => {
                const set = we.sets.find((s) => s.id === setId);
                if (!set) return;
                const completed = !set.completed;
                actions.updateSet.mutate({ id: setId, data: { completed } });
                if (completed) {
                  restTimer.start(we.exerciseId, we.exercise.name);
                }
              }}
              onDeleteExercise={() => actions.deleteExercise.mutate(we.id)}
            />
          );
        })}
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
        onClick={() => finishMutation.mutate(workout.id)}
        disabled={finishMutation.isPending}
        className="w-full rounded-xl bg-red-600 py-4 text-lg font-bold text-white active:bg-red-500 disabled:opacity-60"
        style={{ minHeight: 48 }}
      >
        Terminar
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
