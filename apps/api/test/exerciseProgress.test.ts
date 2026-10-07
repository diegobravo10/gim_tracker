import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp();

async function createWorkoutWithSets(
  exerciseId: string,
  startedAt: Date,
  sets: { weightKg: number; reps: number; isWarmup?: boolean; completed?: boolean }[],
  finished = true,
) {
  const workout = await prisma.workout.create({
    data: {
      startedAt,
      finishedAt: finished ? new Date(startedAt.getTime() + 60 * 60 * 1000) : null,
    },
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
      completed: set.completed ?? true,
    })),
  });
  return workout;
}

describe('GET /exercises/:id/progress', () => {
  it('devuelve 404 si el ejercicio no existe', async () => {
    const res = await request(app).get('/exercises/no-existe/progress');
    expect(res.status).toBe(404);
  });

  it('devuelve listas vacías y PRs nulos sin series registradas', async () => {
    const exercise = await prisma.exercise.create({
      data: { name: 'Press de banca', muscleGroup: 'Pecho' },
    });

    const res = await request(app).get(`/exercises/${exercise.id}/progress`);

    expect(res.status).toBe(200);
    expect(res.body.byWorkout).toEqual([]);
    expect(res.body.prs).toEqual({ maxWeight: null, estimated1RM: null, volume: null });
  });

  it('ignora series de calentamiento y sin completar', async () => {
    const exercise = await prisma.exercise.create({
      data: { name: 'Press de banca', muscleGroup: 'Pecho' },
    });
    await createWorkoutWithSets(exercise.id, new Date('2026-01-01T10:00:00Z'), [
      { weightKg: 100, reps: 5, isWarmup: true },
      { weightKg: 90, reps: 5, completed: false },
    ]);

    const res = await request(app).get(`/exercises/${exercise.id}/progress`);
    expect(res.body.byWorkout).toEqual([]);
  });

  it('calcula máximo, 1RM estimado (Epley) y volumen por workout', async () => {
    const exercise = await prisma.exercise.create({
      data: { name: 'Press de banca', muscleGroup: 'Pecho' },
    });
    const workout = await createWorkoutWithSets(exercise.id, new Date('2026-01-01T10:00:00Z'), [
      { weightKg: 20, reps: 15, isWarmup: true },
      { weightKg: 60, reps: 8 },
      { weightKg: 65, reps: 5 },
    ]);

    const res = await request(app).get(`/exercises/${exercise.id}/progress`);

    expect(res.status).toBe(200);
    expect(res.body.byWorkout).toHaveLength(1);
    const point = res.body.byWorkout[0];
    expect(point.workoutId).toBe(workout.id);
    expect(point.maxWeightKg).toBe(65);
    // Epley: max(60*(1+8/30), 65*(1+5/30)) = max(76, 75.83) = 76
    expect(point.estimated1RM).toBe(76);
    expect(point.volumeKg).toBe(60 * 8 + 65 * 5);
  });

  it('calcula los PRs como el mayor valor entre workouts', async () => {
    const exercise = await prisma.exercise.create({
      data: { name: 'Press de banca', muscleGroup: 'Pecho' },
    });
    const first = await createWorkoutWithSets(exercise.id, new Date('2026-01-01T10:00:00Z'), [
      { weightKg: 60, reps: 8 },
    ]);
    const second = await createWorkoutWithSets(exercise.id, new Date('2026-02-01T10:00:00Z'), [
      { weightKg: 70, reps: 3 },
    ]);

    const res = await request(app).get(`/exercises/${exercise.id}/progress`);

    expect(res.body.prs.maxWeight).toMatchObject({ value: 70, workoutId: second.id });
    // Epley: first = 60*(1+8/30)=76, second = 70*(1+3/30)=77 -> PR es el segundo
    expect(res.body.prs.estimated1RM).toMatchObject({ value: 77, workoutId: second.id });
    // volumen: first = 480, second = 210 -> PR sigue siendo el primero
    expect(res.body.prs.volume).toMatchObject({ value: 480, workoutId: first.id });
  });

  it('incluye el entreno activo (sin terminar) para detectar PRs en vivo', async () => {
    const exercise = await prisma.exercise.create({
      data: { name: 'Press de banca', muscleGroup: 'Pecho' },
    });
    const active = await createWorkoutWithSets(
      exercise.id,
      new Date('2026-03-01T10:00:00Z'),
      [{ weightKg: 80, reps: 5 }],
      false,
    );

    const res = await request(app).get(`/exercises/${exercise.id}/progress`);

    expect(res.body.prs.maxWeight).toMatchObject({ value: 80, workoutId: active.id });
  });

  it('no mueve el PR a un workout que solo empata el valor', async () => {
    const exercise = await prisma.exercise.create({
      data: { name: 'Press de banca', muscleGroup: 'Pecho' },
    });
    const first = await createWorkoutWithSets(exercise.id, new Date('2026-01-01T10:00:00Z'), [
      { weightKg: 60, reps: 8 },
    ]);
    await createWorkoutWithSets(exercise.id, new Date('2026-02-01T10:00:00Z'), [
      { weightKg: 60, reps: 8 },
    ]);

    const res = await request(app).get(`/exercises/${exercise.id}/progress`);

    expect(res.body.prs.maxWeight).toMatchObject({ workoutId: first.id });
  });
});
