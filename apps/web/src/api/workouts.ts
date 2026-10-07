import { api } from './client.ts';
import type { WorkoutDetail, WorkoutExercise, WorkoutSet, WorkoutSummary } from './types.ts';

export function createWorkout(routineId?: string) {
  return api.post<WorkoutDetail>('/workouts', routineId ? { routineId } : {});
}

export function getActiveWorkout() {
  return api.get<WorkoutDetail>('/workouts/active');
}

export function getWorkout(id: string) {
  return api.get<WorkoutDetail>(`/workouts/${id}`);
}

export function listWorkouts() {
  return api.get<WorkoutSummary[]>('/workouts');
}

export function finishWorkout(id: string) {
  return api.patch<WorkoutDetail>(`/workouts/${id}/finish`);
}

export function deleteWorkout(id: string) {
  return api.delete<void>(`/workouts/${id}`);
}

export function addExerciseToWorkout(workoutId: string, exerciseId: string) {
  return api.post<WorkoutExercise>(`/workouts/${workoutId}/exercises`, { exerciseId });
}

export function deleteWorkoutExercise(id: string) {
  return api.delete<void>(`/workout-exercises/${id}`);
}

export interface CreateSetInput {
  weightKg: number;
  reps: number;
  isWarmup?: boolean;
}

export function addSet(workoutExerciseId: string, data: CreateSetInput) {
  return api.post<WorkoutSet>(`/workout-exercises/${workoutExerciseId}/sets`, data);
}

export interface UpdateSetInput {
  weightKg?: number;
  reps?: number;
  isWarmup?: boolean;
  completed?: boolean;
}

export function updateSet(id: string, data: UpdateSetInput) {
  return api.patch<WorkoutSet>(`/sets/${id}`, data);
}

export function deleteSet(id: string) {
  return api.delete<void>(`/sets/${id}`);
}
