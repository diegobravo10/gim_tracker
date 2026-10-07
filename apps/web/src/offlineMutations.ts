import type { QueryClient } from '@tanstack/react-query';
import * as workoutsApi from './api/workouts.ts';
import type { Exercise, WorkoutDetail } from './api/types.ts';
import { replaceExercise, replaceSet } from './lib/workoutCache.ts';

export const mutationKeys = {
  addSet: ['workout-actions', 'add-set'],
  updateSet: ['workout-actions', 'update-set'],
  deleteSet: ['workout-actions', 'delete-set'],
  addExercise: ['workout-actions', 'add-exercise'],
  deleteExercise: ['workout-actions', 'delete-exercise'],
} as const;

export const resolvedOfflineIds = new Map<string, string>();

type AddSetVariables = { workoutExerciseId: string; tempId: string };
type AddExerciseVariables = { workoutId: string; exercise: Exercise; tempId: string };

function workoutQueries(queryClient: QueryClient) {
  return queryClient.getQueriesData<WorkoutDetail>({
    predicate: (query) => Array.isArray((query.state.data as WorkoutDetail | undefined)?.exercises),
  });
}

function patchWorkoutQueries(
  queryClient: QueryClient,
  updater: (workout: WorkoutDetail) => WorkoutDetail,
) {
  for (const [queryKey, workout] of workoutQueries(queryClient)) {
    if (workout) queryClient.setQueryData(queryKey, updater(workout));
  }
}

/**
 * Mutation functions must be registered before IndexedDB is restored.
 * Hydrated paused mutations do not retain JavaScript functions, so these
 * defaults are what lets them continue after a full offline page reload.
 */
export function registerOfflineMutationDefaults(queryClient: QueryClient) {
  queryClient.setMutationDefaults(mutationKeys.updateSet, {
    mutationFn: ({ id, data }: { id: string; data: workoutsApi.UpdateSetInput }) =>
      workoutsApi.updateSet(id, data),
  });
  queryClient.setMutationDefaults(mutationKeys.deleteSet, {
    mutationFn: (id: string) => workoutsApi.deleteSet(id),
  });
  queryClient.setMutationDefaults(mutationKeys.deleteExercise, {
    mutationFn: (id: string) => workoutsApi.deleteWorkoutExercise(id),
  });
  queryClient.setMutationDefaults(mutationKeys.addExercise, {
    mutationFn: ({ workoutId, exercise }: AddExerciseVariables) =>
      workoutsApi.addExerciseToWorkout(workoutId, exercise.id),
    onSuccess: (realExercise, { tempId }) => {
      resolvedOfflineIds.set(tempId, realExercise.id);
      patchWorkoutQueries(queryClient, (workout) => replaceExercise(workout, tempId, realExercise));
    },
  });
  queryClient.setMutationDefaults(mutationKeys.addSet, {
    mutationFn: async ({ workoutExerciseId, tempId }: AddSetVariables) => {
      const parentId = resolvedOfflineIds.get(workoutExerciseId) ?? workoutExerciseId;
      const cachedSet = workoutQueries(queryClient)
        .flatMap(([, workout]) => workout?.exercises ?? [])
        .flatMap((exercise) => exercise.sets)
        .find((set) => set.id === tempId);
      let realSet = await workoutsApi.addSet(parentId, {
        weightKg: cachedSet?.weightKg ?? 0,
        reps: cachedSet?.reps ?? 0,
        isWarmup: cachedSet?.isWarmup ?? false,
      });
      if (cachedSet?.completed) {
        realSet = await workoutsApi.updateSet(realSet.id, { completed: true });
      }
      return realSet;
    },
    onSuccess: (realSet, { tempId }) => {
      patchWorkoutQueries(queryClient, (workout) => replaceSet(workout, tempId, realSet));
    },
  });
}
