import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp();

describe('/sets', () => {
  let setId: string;

  beforeEach(async () => {
    const exercise = await prisma.exercise.create({
      data: { name: 'Press de banca', muscleGroup: 'Pecho' },
    });
    const workout = await prisma.workout.create({ data: {} });
    const workoutExercise = await prisma.workoutExercise.create({
      data: { workoutId: workout.id, exerciseId: exercise.id, order: 0 },
    });
    const set = await prisma.workoutSet.create({
      data: { workoutExerciseId: workoutExercise.id, order: 0, weightKg: 60, reps: 8 },
    });
    setId = set.id;
  });

  it('actualiza peso y repeticiones', async () => {
    const res = await request(app).patch(`/sets/${setId}`).send({ weightKg: 65, reps: 6 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ weightKg: 65, reps: 6 });
  });

  it('marca una serie como completada y guarda completedAt', async () => {
    const res = await request(app).patch(`/sets/${setId}`).send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
    expect(res.body.completedAt).not.toBeNull();
  });

  it('desmarca una serie y limpia completedAt', async () => {
    await request(app).patch(`/sets/${setId}`).send({ completed: true });
    const res = await request(app).patch(`/sets/${setId}`).send({ completed: false });

    expect(res.body.completed).toBe(false);
    expect(res.body.completedAt).toBeNull();
  });

  it('rechaza un body vacío', async () => {
    const res = await request(app).patch(`/sets/${setId}`).send({});
    expect(res.status).toBe(400);
  });

  it('devuelve 404 al actualizar una serie inexistente', async () => {
    const res = await request(app).patch('/sets/no-existe').send({ reps: 5 });
    expect(res.status).toBe(404);
  });

  it('elimina una serie', async () => {
    const res = await request(app).delete(`/sets/${setId}`);
    expect(res.status).toBe(204);

    const stored = await prisma.workoutSet.findUnique({ where: { id: setId } });
    expect(stored).toBeNull();
  });

  it('devuelve 404 al eliminar una serie inexistente', async () => {
    const res = await request(app).delete('/sets/no-existe');
    expect(res.status).toBe(404);
  });
});
