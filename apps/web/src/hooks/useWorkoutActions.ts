import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useRef } from 'react';
import * as workoutsApi from '../api/workouts.ts';
import type { Exercise, WorkoutDetail, WorkoutExercise, WorkoutSet } from '../api/types.ts';
import { createTempId, isTempId } from '../lib/tempId.ts';
import { mutationKeys, resolvedOfflineIds } from '../offlineMutations.ts';
import {
  insertExercise,
  insertSet,
  mapSet,
  removeExercise,
  removeSet,
  replaceExercise,
  replaceSet,
} from '../lib/workoutCache.ts';

/**
 * Mutaciones sobre el detalle de un entreno (activo o del historial),
 * identificado por su queryKey.
 *
 * Crear series/ejercicios usa un id temporal (ver lib/tempId.ts) e inserta
 * el registro en el cache de inmediato, sin esperar la red. Offline, la
 * mutación de red queda "pausada" por TanStack Query y se reintenta sola al
 * reconectar (ver networkMode por defecto + onlineManager en queryClient.ts).
 * `scope` asegura que, para un mismo entreno, las mutaciones pausadas se
 * reanuden en el mismo orden en que se dispararon.
 *
 * IMPORTANTE: toda la lógica de reconciliación va en los callbacks
 * `onSuccess`/`onError` definidos a nivel de `useMutation`, nunca en los que
 * se pasan por-llamada a `.mutate(vars, { onSuccess })`. Verificado a mano
 * que estos últimos no se disparan de forma confiable cuando una mutación
 * se pausó offline y se reanuda más tarde (sobre todo si en el medio se
 * canceló una mutación hermana del mismo scope) — los de useMutation sí.
 *
 * Dos problemas offline-específicos que esto resuelve:
 * 1. Una serie se crea con "+ serie" (datos iniciales) y después se ajusta
 *    con los steppers. Online eso funciona porque el POST ya viaja antes de
 *    que el usuario termine de tocar los steppers. Offline, el POST queda
 *    en cola y recién se manda al reconectar — si mandara los datos
 *    capturados en el momento del "+ serie" perdería los ajustes
 *    posteriores. Por eso el POST de addSet lee los valores vigentes del
 *    cache recién al ejecutarse, no al encolarse. El campo "completed" no
 *    lo acepta el POST (el backend siempre crea la serie sin marcar), así
 *    que si ya estaba marcada localmente se manda un PATCH de más apenas
 *    el POST resuelve.
 * 2. Si además el ejercicio en sí se agregó offline (id temporal), un POST
 *    hijo encolado con ese id temporal quedaría apuntando a un id que deja
 *    de existir en cuanto el ejercicio sincroniza y el cache lo reemplaza
 *    por el real. `resolveId` lleva un mapa temp->real para que esas
 *    mutaciones encoladas usen el id correcto al ejecutarse.
 */
export function useWorkoutActions(queryKey: QueryKey) {
  const queryClient = useQueryClient();
  const scope = { id: JSON.stringify(queryKey) };
  const resolvedIds = useRef(resolvedOfflineIds);

  function resolveId(id: string): string {
    return resolvedIds.current.get(id) ?? id;
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  function getCached() {
    return queryClient.getQueryData<WorkoutDetail>(queryKey);
  }

  function patch(updater: (workout: WorkoutDetail) => WorkoutDetail) {
    queryClient.setQueryData<WorkoutDetail>(queryKey, (current) => (current ? updater(current) : current));
  }

  /** Cancela creaciones todavía en cola (offline, nunca llegaron a mandarse) que cumplan `matches`. */
  function cancelPendingCreate(matches: (variables: unknown) => boolean) {
    const cache = queryClient.getMutationCache();
    for (const mutation of cache.getAll()) {
      if (mutation.state.isPaused && matches(mutation.state.variables)) {
        cache.remove(mutation);
      }
    }
  }

  const updateSetMutation = useMutation({
    mutationKey: mutationKeys.updateSet,
    scope,
    mutationFn: ({ id, data }: { id: string; data: workoutsApi.UpdateSetInput }) =>
      workoutsApi.updateSet(id, data),
    onSettled: () => {
      invalidate();
      // Un peso/reps/completado nuevo puede romper un PR: refresca el
      // progreso de ejercicios para que el badge 🏆 reaccione al toque.
      queryClient.invalidateQueries({ queryKey: ['exercise-progress'] });
    },
  });

  function updateSet(id: string, data: workoutsApi.UpdateSetInput) {
    patch((workout) => mapSet(workout, id, data));

    if (isTempId(id)) {
      // Todavía no existe en el servidor: el POST que lo crea (addSet) lee
      // los valores vigentes del cache al ejecutarse, así que este cambio
      // ya viaja con él (ver reconciliación de "completed" en addSet).
      // Mandar un PATCH aparte solo generaría un 404 una vez el id
      // temporal se reemplace por el real.
      return;
    }

    updateSetMutation.mutate({ id, data });
  }

  const addSetMutation = useMutation({
    mutationKey: mutationKeys.addSet,
    scope,
    mutationFn: ({ workoutExerciseId, tempId }: { workoutExerciseId: string; tempId: string }) => {
      const realWorkoutExerciseId = resolveId(workoutExerciseId);
      const set = getCached()
        ?.exercises.find((we) => we.id === realWorkoutExerciseId)
        ?.sets.find((s) => s.id === tempId);
      const data: workoutsApi.CreateSetInput = set
        ? { weightKg: set.weightKg, reps: set.reps, isWarmup: set.isWarmup }
        : { weightKg: 0, reps: 0 };
      return workoutsApi.addSet(realWorkoutExerciseId, data);
    },
    onSuccess: (realSet, { workoutExerciseId, tempId }) => {
      const wasCompleted = getCached()
        ?.exercises.find((we) => we.id === resolveId(workoutExerciseId))
        ?.sets.find((s) => s.id === tempId)?.completed;
      patch((workout) => replaceSet(workout, tempId, realSet));
      if (wasCompleted) {
        updateSet(realSet.id, { completed: true });
      }
    },
    onError: (_err, { tempId }) => {
      patch((workout) => removeSet(workout, tempId));
    },
  });

  function addSet(workoutExerciseId: string, data: workoutsApi.CreateSetInput): string {
    const tempId = createTempId();
    const workoutExercise = getCached()?.exercises.find((we) => we.id === workoutExerciseId);
    const optimisticSet: WorkoutSet = {
      id: tempId,
      workoutExerciseId,
      order: workoutExercise?.sets.length ?? 0,
      weightKg: data.weightKg,
      reps: data.reps,
      isWarmup: data.isWarmup ?? false,
      completed: false,
      completedAt: null,
    };
    patch((workout) => insertSet(workout, workoutExerciseId, optimisticSet));
    addSetMutation.mutate({ workoutExerciseId, tempId });
    return tempId;
  }

  const deleteSetMutation = useMutation({
    mutationKey: mutationKeys.deleteSet,
    scope,
    mutationFn: (id: string) => workoutsApi.deleteSet(id),
    onSettled: invalidate,
  });

  function deleteSet(id: string) {
    patch((workout) => removeSet(workout, id));

    if (isTempId(id)) {
      cancelPendingCreate((vars) => (vars as { tempId?: string })?.tempId === id);
      return;
    }

    deleteSetMutation.mutate(id);
  }

  const addExerciseMutation = useMutation({
    mutationKey: mutationKeys.addExercise,
    scope,
    mutationFn: ({ workoutId, exercise }: { workoutId: string; exercise: Exercise; tempId: string }) =>
      workoutsApi.addExerciseToWorkout(workoutId, exercise.id),
    onSuccess: (realExercise, { tempId }) => {
      resolvedIds.current.set(tempId, realExercise.id);
      patch((workout) => replaceExercise(workout, tempId, realExercise));
    },
    onError: (_err, { tempId }) => {
      patch((workout) => removeExercise(workout, tempId));
    },
  });

  function addExercise(workoutId: string, exercise: Exercise): string {
    const tempId = createTempId();
    const current = getCached();
    const optimisticExercise: WorkoutExercise = {
      id: tempId,
      workoutId,
      exerciseId: exercise.id,
      order: current?.exercises.length ?? 0,
      exercise,
      sets: [],
    };
    patch((workout) => insertExercise(workout, optimisticExercise));
    addExerciseMutation.mutate({ workoutId, exercise, tempId });
    return tempId;
  }

  const deleteExerciseMutation = useMutation({
    mutationKey: mutationKeys.deleteExercise,
    scope,
    mutationFn: (id: string) => workoutsApi.deleteWorkoutExercise(id),
    onSettled: invalidate,
  });

  function deleteExercise(id: string) {
    patch((workout) => removeExercise(workout, id));

    if (isTempId(id)) {
      // También cancela cualquier serie que se haya alcanzado a agregar
      // offline a este ejercicio temporal: nunca van a tener dónde colgarse.
      cancelPendingCreate(
        (vars) =>
          (vars as { tempId?: string })?.tempId === id ||
          (vars as { workoutExerciseId?: string })?.workoutExerciseId === id,
      );
      return;
    }

    deleteExerciseMutation.mutate(id);
  }

  return { updateSet, addSet, deleteSet, addExercise, deleteExercise };
}
