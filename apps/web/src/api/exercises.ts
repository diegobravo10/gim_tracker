import { api } from './client.ts';
import type { Exercise, LastExerciseSets } from './types.ts';

export function listExercises(q?: string) {
  const query = q ? `?q=${encodeURIComponent(q)}` : '';
  return api.get<Exercise[]>(`/exercises${query}`);
}

export function getExerciseLastSets(exerciseId: string) {
  return api.get<LastExerciseSets>(`/exercises/${exerciseId}/last`);
}
