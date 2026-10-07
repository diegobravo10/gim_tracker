import type { UpdateSetInput } from '../api/workouts.ts';
import type { WorkoutDetail, WorkoutExercise, WorkoutSet } from '../api/types.ts';

/** Reducers puros sobre un WorkoutDetail, usados para las actualizaciones
 * optimistas del cache de TanStack Query (incluye insertar/reemplazar/quitar
 * con IDs temporales para series y ejercicios creados offline). */

export function mapSet(workout: WorkoutDetail, setId: string, patch: UpdateSetInput): WorkoutDetail {
  return {
    ...workout,
    exercises: workout.exercises.map((we) => ({
      ...we,
      sets: we.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
    })),
  };
}

export function insertSet(
  workout: WorkoutDetail,
  workoutExerciseId: string,
  set: WorkoutSet,
): WorkoutDetail {
  return {
    ...workout,
    exercises: workout.exercises.map((we) =>
      we.id === workoutExerciseId ? { ...we, sets: [...we.sets, set] } : we,
    ),
  };
}

export function replaceSet(workout: WorkoutDetail, tempId: string, realSet: WorkoutSet): WorkoutDetail {
  return {
    ...workout,
    exercises: workout.exercises.map((we) => ({
      ...we,
      sets: we.sets.map((set) => (set.id === tempId ? realSet : set)),
    })),
  };
}

export function removeSet(workout: WorkoutDetail, setId: string): WorkoutDetail {
  return {
    ...workout,
    exercises: workout.exercises.map((we) => ({
      ...we,
      sets: we.sets.filter((set) => set.id !== setId),
    })),
  };
}

export function insertExercise(workout: WorkoutDetail, exercise: WorkoutExercise): WorkoutDetail {
  return { ...workout, exercises: [...workout.exercises, exercise] };
}

/** Reemplaza un ejercicio temporal por el real, preservando las series que
 * ya se le hayan agregado localmente (el POST que crea el ejercicio en el
 * servidor siempre responde con sets: [], así que no hay que pisarlas). */
export function replaceExercise(
  workout: WorkoutDetail,
  tempId: string,
  realExercise: WorkoutExercise,
): WorkoutDetail {
  return {
    ...workout,
    exercises: workout.exercises.map((we) =>
      we.id === tempId ? { ...realExercise, sets: we.sets } : we,
    ),
  };
}

export function removeExercise(workout: WorkoutDetail, workoutExerciseId: string): WorkoutDetail {
  return {
    ...workout,
    exercises: workout.exercises.filter((we) => we.id !== workoutExerciseId),
  };
}
