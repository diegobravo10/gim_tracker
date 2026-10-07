import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExerciseLastSets, getExerciseProgress } from '../api/exercises.ts';
import { ApiError } from '../api/client.ts';
import * as workoutsApi from '../api/workouts.ts';
import type { Exercise, LastExerciseSets, WorkoutExercise } from '../api/types.ts';
import { AddExerciseSheet } from '../components/AddExerciseSheet.tsx';
import { ElapsedTimer } from '../components/ElapsedTimer.tsx';
import { ExerciseCard } from '../components/ExerciseCard.tsx';
import { useOnline } from '../hooks/useOnline.ts';
import { useRestTimer } from '../hooks/useRestTimer.ts';
import { useWorkoutActions } from '../hooks/useWorkoutActions.ts';
import { formatLastTimeSummary } from '../lib/formatters.ts';

const QUERY_KEY = ['workout', 'active'];

// Si la red falla (sin conexión incluida) no hay prellenado: no es un
// error, el usuario agrega las series a mano.
function fetchLastOrNull(exerciseId: string): Promise<LastExerciseSets | null> {
  return getExerciseLastSets(exerciseId).catch(() => null);
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
  const isOnline = useOnline();

  const lastDataQueries = useQueries({
    queries: (workout?.exercises ?? []).map((we) => ({
      queryKey: ['exercise-last', we.exerciseId],
      queryFn: () => fetchLastOrNull(we.exerciseId),
      staleTime: Infinity,
    })),
  });

  const progressQueries = useQueries({
    queries: (workout?.exercises ?? []).map((we) => ({
      queryKey: ['exercise-progress', we.exerciseId],
      queryFn: () => getExerciseProgress(we.exerciseId),
    })),
  });

  const finishMutation = useMutation({
    mutationFn: (id: string) => workoutsApi.finishWorkout(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: QUERY_KEY });
      navigate('/historial');
    },
  });

  function handleSelectExercise(exercise: Exercise) {
    setShowAddExercise(false);
    if (!workout) return;

    // addExercise/addSet insertan de inmediato con un id temporal (ver
    // useWorkoutActions): no hay que esperar la red para seguir, lo que
    // además permite que el prellenado funcione estando offline.
    const workoutExerciseTempId = actions.addExercise(workout.id, exercise);

    queryClient
      .fetchQuery({
        queryKey: ['exercise-last', exercise.id],
        queryFn: () => fetchLastOrNull(exercise.id),
        staleTime: Infinity,
      })
      .then((last) => {
        for (const set of last?.sets ?? []) {
          actions.addSet(workoutExerciseTempId, {
            weightKg: set.weightKg,
            reps: set.reps,
            isWarmup: set.isWarmup,
          });
        }
      });
  }

  function handleAddSet(workoutExercise: WorkoutExercise) {
    const previous = workoutExercise.sets.at(-1);
    actions.addSet(workoutExercise.id, {
      weightKg: previous?.weightKg ?? 0,
      reps: previous?.reps ?? 0,
    });
  }

  if (isLoading && !workout) {
    return <p className="pt-16 text-center text-neutral-500">Cargando...</p>;
  }

  // Un refetch puede fallar al arrancar sin red aunque IndexedDB ya haya
  // restaurado un entreno válido. En ese caso seguimos mostrando el cache;
  // el error solo reemplaza la pantalla cuando realmente no hay datos.
  if (isError && !workout) {
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
          const prs = progressQueries[index]?.data?.prs;
          const isPR =
            !!prs &&
            (prs.maxWeight?.workoutId === workout.id ||
              prs.estimated1RM?.workoutId === workout.id ||
              prs.volume?.workoutId === workout.id);
          return (
            <ExerciseCard
              key={we.id}
              workoutExercise={we}
              lastTimeSummary={last ? formatLastTimeSummary(last.sets) : null}
              isPR={isPR}
              onAddSet={() => handleAddSet(we)}
              onDeleteSet={(setId) => actions.deleteSet(setId)}
              onChangeSetWeight={(setId, weightKg) => actions.updateSet(setId, { weightKg })}
              onChangeSetReps={(setId, reps) => actions.updateSet(setId, { reps })}
              onToggleSetCompleted={(setId) => {
                const set = we.sets.find((s) => s.id === setId);
                if (!set) return;
                const completed = !set.completed;
                actions.updateSet(setId, { completed });
                if (completed) {
                  restTimer.start(we.exerciseId, we.exercise.name);
                }
              }}
              onDeleteExercise={() => actions.deleteExercise(we.id)}
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
        {finishMutation.isPending && !isOnline ? 'Esperando conexión...' : 'Terminar'}
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
