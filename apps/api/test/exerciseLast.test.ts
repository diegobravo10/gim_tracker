import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp();

async function createFinishedWorkoutWithSets(
  exerciseId: string,
  startedAt: Date,
  sets: { weightKg: number; reps: number; isWarmup?: boolean }[],
) {
  const workout = await prisma.workout.create({
    data: { startedAt, finishedAt: new Date(startedAt.getTime() + 60 * 60 * 1000) },
  });
  const workoutExercise = await prisma.workoutExercise.create({
    data: { workoutId: workout.id, exerciseId, order: 0 },
  });
  await prisma.workoutSet.createMany({
    data: sets.map((set, index) => ({
      workoutExerciseId: workoutExercise.id,
      order: index,
      weightKg: set.weightKg,
      reps: set.reps,
      isWarmup: set.isWarmup ?? false,
    })),
  });
  return workout;
}

describe('GET /exercises/:id/last', () => {
  it('devuelve 404 si el ejercicio no existe', async () => {
    const res = await request(app).get('/exercises/no-existe/last');
    expect(res.status).toBe(404);
  });

  it('devuelve 404 si no hay un entreno previo terminado', async () => {
    const exercise = await prisma.exercise.create({
      data: { name: 'Press de banca', muscleGroup: 'Pecho' },
    });

    const res = await request(app).get(`/exercises/${exercise.id}/last`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NO_PREVIOUS_DATA');
  });

  it('ignora el entreno activo (sin terminar)', async () => {
    const exercise = await prisma.exercise.create({
      data: { name: 'Sentadilla', muscleGroup: 'Piernas' },
    });
    const workout = await prisma.workout.create({ data: {} });
    const workoutExercise = await prisma.workoutExercise.create({
      data: { workoutId: workout.id, exerciseId: exercise.id, order: 0 },
    });
    await prisma.workoutSet.create({
      data: { workoutExerciseId: workoutExercise.id, order: 0, weightKg: 100, reps: 5 },
    });

    const res = await request(app).get(`/exercises/${exercise.id}/last`);
    expect(res.status).toBe(404);
  });

  it('devuelve las series del último entreno terminado que incluyó el ejercicio', async () => {
    const exercise = await prisma.exercise.create({
      data: { name: 'Press de banca', muscleGroup: 'Pecho' },
    });

    await createFinishedWorkoutWithSets(exercise.id, new Date('2026-01-01T10:00:00Z'), [
      { weightKg: 50, reps: 10 },
      { weightKg: 50, reps: 10 },
    ]);
    const latest = await createFinishedWorkoutWithSets(
      exercise.id,
      new Date('2026-02-01T10:00:00Z'),
      [
        { weightKg: 20, reps: 15, isWarmup: true },
        { weightKg: 60, reps: 8 },
        { weightKg: 60, reps: 8 },
        { weightKg: 60, reps: 8 },
      ],
    );

    const res = await request(app).get(`/exercises/${exercise.id}/last`);

    expect(res.status).toBe(200);
    expect(res.body.workoutId).toBe(latest.id);
    expect(res.body.sets).toEqual([
      { order: 0, weightKg: 20, reps: 15, isWarmup: true },
      { order: 1, weightKg: 60, reps: 8, isWarmup: false },
      { order: 2, weightKg: 60, reps: 8, isWarmup: false },
      { order: 3, weightKg: 60, reps: 8, isWarmup: false },
    ]);
  });
});
