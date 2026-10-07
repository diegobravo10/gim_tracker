import { api } from './client.ts';
import type { Exercise, ExerciseProgress, LastExerciseSets } from './types.ts';

export function listExercises(q?: string) {
  const query = q ? `?q=${encodeURIComponent(q)}` : '';
  return api.get<Exercise[]>(`/exercises${query}`);
}

export function getExercise(exerciseId: string) {
  return api.get<Exercise>(`/exercises/${exerciseId}`);
}

export function getExerciseLastSets(exerciseId: string) {
  return api.get<LastExerciseSets>(`/exercises/${exerciseId}/last`);
}

export function getExerciseProgress(exerciseId: string) {
  return api.get<ExerciseProgress>(`/exercises/${exerciseId}/progress`);
}
