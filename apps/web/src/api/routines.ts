import { api } from './client.ts';
import type { Routine } from './types.ts';

export interface RoutineItemInput {
  exerciseId: string;
  targetSets?: number;
  targetReps?: number;
}

export interface SaveRoutineInput {
  name: string;
  items: RoutineItemInput[];
}

export function listRoutines() {
  return api.get<Routine[]>('/routines');
}

export function getRoutine(id: string) {
  return api.get<Routine>(`/routines/${id}`);
}

export function createRoutine(data: SaveRoutineInput) {
  return api.post<Routine>('/routines', data);
}

export function updateRoutine(id: string, data: Partial<SaveRoutineInput>) {
  return api.patch<Routine>(`/routines/${id}`, data);
}

export function deleteRoutine(id: string) {
  return api.delete<void>(`/routines/${id}`);
}
