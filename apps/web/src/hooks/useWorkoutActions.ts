import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import * as workoutsApi from '../api/workouts.ts';
import type { WorkoutDetail } from '../api/types.ts';

function mapSet(
  workout: WorkoutDetail,
  setId: string,
  patch: workoutsApi.UpdateSetInput,
): WorkoutDetail {
  return {
    ...workout,
    exercises: workout.exercises.map((we) => ({
      ...we,
      sets: we.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
    })),
  };
}

/** Mutaciones sobre el detalle de un entreno (activo o del historial), identificado por su queryKey. */
export function useWorkoutActions(queryKey: QueryKey) {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const updateSet = useMutation({
    mutationFn: ({ id, data }: { id: string; data: workoutsApi.UpdateSetInput }) =>
      workoutsApi.updateSet(id, data),
    onMutate: async ({ id, data }) => {
      const previous = queryClient.getQueryData<WorkoutDetail>(queryKey);
      queryClient.setQueryData<WorkoutDetail>(queryKey, (current) =>
        current ? mapSet(current, id, data) : current,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: invalidate,
  });

  const addSet = useMutation({
    mutationFn: ({
      workoutExerciseId,
      data,
    }: {
      workoutExerciseId: string;
      data: workoutsApi.CreateSetInput;
    }) => workoutsApi.addSet(workoutExerciseId, data),
    onSuccess: invalidate,
  });

  const deleteSet = useMutation({
    mutationFn: (id: string) => workoutsApi.deleteSet(id),
    onSuccess: invalidate,
  });

  const addExercise = useMutation({
    mutationFn: ({ workoutId, exerciseId }: { workoutId: string; exerciseId: string }) =>
      workoutsApi.addExerciseToWorkout(workoutId, exerciseId),
    onSuccess: invalidate,
  });

  const deleteExercise = useMutation({
    mutationFn: (id: string) => workoutsApi.deleteWorkoutExercise(id),
    onSuccess: invalidate,
  });

  return { updateSet, addSet, deleteSet, addExercise, deleteExercise };
}
