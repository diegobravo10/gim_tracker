import { describe, expect, it } from 'vitest';
import type { WorkoutDetail, WorkoutExercise, WorkoutSet } from '../api/types.ts';
import {
  insertExercise,
  insertSet,
  mapSet,
  removeExercise,
  removeSet,
  replaceExercise,
  replaceSet,
} from './workoutCache.ts';

function makeSet(id: string, overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id,
    workoutExerciseId: 'we-1',
    order: 0,
    weightKg: 60,
    reps: 8,
    isWarmup: false,
    completed: false,
    completedAt: null,
    ...overrides,
  };
}

function makeExercise(id: string, sets: WorkoutSet[] = []): WorkoutExercise {
  return {
    id,
    workoutId: 'w-1',
    exerciseId: 'ex-1',
    order: 0,
    exercise: { id: 'ex-1', name: 'Press de banca', muscleGroup: 'Pecho', createdAt: '' },
    sets,
  };
}

function makeWorkout(exercises: WorkoutExercise[]): WorkoutDetail {
  return {
    id: 'w-1',
    routineId: null,
    startedAt: '2026-01-01T10:00:00Z',
    finishedAt: null,
    createdAt: '2026-01-01T10:00:00Z',
    exercises,
    totalVolumeKg: 0,
  };
}

describe('mapSet', () => {
  it('actualiza solo el set con el id dado', () => {
    const workout = makeWorkout([makeExercise('we-1', [makeSet('s-1'), makeSet('s-2')])]);
    const result = mapSet(workout, 's-1', { weightKg: 65 });

    expect(result.exercises[0].sets[0].weightKg).toBe(65);
    expect(result.exercises[0].sets[1].weightKg).toBe(60);
  });
});

describe('insertSet / replaceSet / removeSet', () => {
  it('inserta un set nuevo en el workoutExercise correcto', () => {
    const workout = makeWorkout([makeExercise('we-1'), makeExercise('we-2')]);
    const tempSet = makeSet('temp-abc', { workoutExerciseId: 'we-2' });

    const result = insertSet(workout, 'we-2', tempSet);

    expect(result.exercises[0].sets).toHaveLength(0);
    expect(result.exercises[1].sets).toEqual([tempSet]);
  });

  it('reemplaza un set temporal por el real preservando el resto', () => {
    const workout = makeWorkout([
      makeExercise('we-1', [makeSet('temp-abc', { weightKg: 60 })]),
    ]);
    const realSet = makeSet('real-1', { weightKg: 60 });

    const result = replaceSet(workout, 'temp-abc', realSet);

    expect(result.exercises[0].sets).toEqual([realSet]);
  });

  it('quita un set por id', () => {
    const workout = makeWorkout([makeExercise('we-1', [makeSet('s-1'), makeSet('s-2')])]);

    const result = removeSet(workout, 's-1');

    expect(result.exercises[0].sets.map((s) => s.id)).toEqual(['s-2']);
  });
});

describe('insertExercise / replaceExercise / removeExercise', () => {
  it('agrega un ejercicio al final', () => {
    const workout = makeWorkout([makeExercise('we-1')]);
    const tempExercise = makeExercise('temp-xyz');

    const result = insertExercise(workout, tempExercise);

    expect(result.exercises.map((we) => we.id)).toEqual(['we-1', 'temp-xyz']);
  });

  it('reemplaza un ejercicio temporal por el real', () => {
    const workout = makeWorkout([makeExercise('temp-xyz')]);
    const realExercise = makeExercise('real-1');

    const result = replaceExercise(workout, 'temp-xyz', realExercise);

    expect(result.exercises).toEqual([realExercise]);
  });

  it('conserva las series agregadas localmente al reemplazar (el POST que crea el ejercicio siempre responde sin series)', () => {
    const localSet = makeSet('temp-set-1', { workoutExerciseId: 'temp-xyz' });
    const workout = makeWorkout([makeExercise('temp-xyz', [localSet])]);
    const realExercise = makeExercise('real-1'); // como responde el servidor: sin series

    const result = replaceExercise(workout, 'temp-xyz', realExercise);

    expect(result.exercises).toEqual([{ ...realExercise, sets: [localSet] }]);
  });

  it('quita un ejercicio por id', () => {
    const workout = makeWorkout([makeExercise('we-1'), makeExercise('we-2')]);

    const result = removeExercise(workout, 'we-1');

    expect(result.exercises.map((we) => we.id)).toEqual(['we-2']);
  });
});
