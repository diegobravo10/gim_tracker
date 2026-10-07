import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp();

describe('/workouts/:id/exercises y /workout-exercises', () => {
  let workoutId: string;
  let exerciseId: string;

  beforeEach(async () => {
    const workout = await request(app).post('/workouts').send({});
    workoutId = workout.body.id;

    const exercise = await prisma.exercise.create({
      data: { name: 'Press de banca', muscleGroup: 'Pecho' },
    });
    exerciseId = exercise.id;
  });

  it('agrega un ejercicio al entreno', async () => {
    const res = await request(app)
      .post(`/workouts/${workoutId}/exercises`)
      .send({ exerciseId });

    expect(res.status).toBe(201);
    expect(res.body.exerciseId).toBe(exerciseId);
    expect(res.body.order).toBe(0);
  });

  it('asigna order incremental a los ejercicios agregados', async () => {
    const other = await prisma.exercise.create({
      data: { name: 'Sentadilla', muscleGroup: 'Piernas' },
    });

    await request(app).post(`/workouts/${workoutId}/exercises`).send({ exerciseId });
    const res = await request(app)
      .post(`/workouts/${workoutId}/exercises`)
      .send({ exerciseId: other.id });

    expect(res.body.order).toBe(1);
  });

  it('devuelve 404 si el entreno no existe', async () => {
    const res = await request(app)
      .post('/workouts/no-existe/exercises')
      .send({ exerciseId });
    expect(res.status).toBe(404);
  });

  it('devuelve 404 si el ejercicio no existe', async () => {
    const res = await request(app)
      .post(`/workouts/${workoutId}/exercises`)
      .send({ exerciseId: 'no-existe' });
    expect(res.status).toBe(404);
  });

  it('elimina un ejercicio del entreno y sus series en cascada', async () => {
    const added = await request(app)
      .post(`/workouts/${workoutId}/exercises`)
      .send({ exerciseId });
    const workoutExerciseId = added.body.id;

    await request(app)
      .post(`/workout-exercises/${workoutExerciseId}/sets`)
      .send({ weightKg: 60, reps: 8 });

    const res = await request(app).delete(`/workout-exercises/${workoutExerciseId}`);
    expect(res.status).toBe(204);

    const remainingSets = await prisma.workoutSet.findMany({ where: { workoutExerciseId } });
    expect(remainingSets).toHaveLength(0);
  });

  it('devuelve 404 al eliminar un workout-exercise inexistente', async () => {
    const res = await request(app).delete('/workout-exercises/no-existe');
    expect(res.status).toBe(404);
  });

  describe('POST /workout-exercises/:id/sets', () => {
    let workoutExerciseId: string;

    beforeEach(async () => {
      const added = await request(app)
        .post(`/workouts/${workoutId}/exercises`)
        .send({ exerciseId });
      workoutExerciseId = added.body.id;
    });

    it('crea una serie', async () => {
      const res = await request(app)
        .post(`/workout-exercises/${workoutExerciseId}/sets`)
        .send({ weightKg: 60, reps: 8 });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ weightKg: 60, reps: 8, isWarmup: false, completed: false });
      expect(res.body.order).toBe(0);
    });

    it('rechaza peso negativo', async () => {
      const res = await request(app)
        .post(`/workout-exercises/${workoutExerciseId}/sets`)
        .send({ weightKg: -1, reps: 8 });

      expect(res.status).toBe(400);
    });

    it('devuelve 404 si el workout-exercise no existe', async () => {
      const res = await request(app)
        .post('/workout-exercises/no-existe/sets')
        .send({ weightKg: 60, reps: 8 });

      expect(res.status).toBe(404);
    });
  });
});
