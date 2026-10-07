import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp();

async function createExercise(name: string, muscleGroup = 'Pecho') {
  return prisma.exercise.create({ data: { name, muscleGroup } });
}

describe('/routines', () => {
  it('crea una rutina con ejercicios ordenados', async () => {
    const benchPress = await createExercise('Press de banca');
    const squat = await createExercise('Sentadilla', 'Piernas');

    const res = await request(app)
      .post('/routines')
      .send({
        name: 'Push day',
        items: [
          { exerciseId: benchPress.id, targetSets: 4, targetReps: 8 },
          { exerciseId: squat.id },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Push day');
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0]).toMatchObject({
      order: 0,
      targetSets: 4,
      targetReps: 8,
      exercise: { name: 'Press de banca' },
    });
    expect(res.body.items[1]).toMatchObject({ order: 1, targetSets: null, targetReps: null });
  });

  it('rechaza una rutina sin nombre', async () => {
    const res = await request(app).post('/routines').send({ items: [] });
    expect(res.status).toBe(400);
  });

  it('devuelve 400 si un ejercicio de la rutina no existe', async () => {
    const res = await request(app)
      .post('/routines')
      .send({ name: 'Rutina rota', items: [{ exerciseId: 'no-existe' }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_EXERCISE');
  });

  it('lista rutinas', async () => {
    await request(app).post('/routines').send({ name: 'A', items: [] });
    await request(app).post('/routines').send({ name: 'B', items: [] });

    const res = await request(app).get('/routines');
    expect(res.body.map((r: { name: string }) => r.name)).toEqual(['A', 'B']);
  });

  it('obtiene el detalle de una rutina', async () => {
    const created = await request(app).post('/routines').send({ name: 'Push day', items: [] });

    const res = await request(app).get(`/routines/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it('devuelve 404 para una rutina inexistente', async () => {
    const res = await request(app).get('/routines/no-existe');
    expect(res.status).toBe(404);
  });

  it('reemplaza los ejercicios de una rutina al actualizar', async () => {
    const exerciseA = await createExercise('Press de banca');
    const exerciseB = await createExercise('Remo con barra', 'Espalda');
    const created = await request(app)
      .post('/routines')
      .send({ name: 'Push day', items: [{ exerciseId: exerciseA.id }] });

    const res = await request(app)
      .patch(`/routines/${created.body.id}`)
      .send({ name: 'Pull day', items: [{ exerciseId: exerciseB.id, targetSets: 3 }] });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Pull day');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({ exerciseId: exerciseB.id, targetSets: 3 });
  });

  it('rechaza un PATCH con body vacío', async () => {
    const created = await request(app).post('/routines').send({ name: 'Push day', items: [] });
    const res = await request(app).patch(`/routines/${created.body.id}`).send({});
    expect(res.status).toBe(400);
  });

  it('elimina una rutina', async () => {
    const created = await request(app).post('/routines').send({ name: 'Push day', items: [] });

    const res = await request(app).delete(`/routines/${created.body.id}`);
    expect(res.status).toBe(204);

    const after = await request(app).get(`/routines/${created.body.id}`);
    expect(after.status).toBe(404);
  });

  it('al borrar una rutina usada por un entreno, el entreno queda sin rutina', async () => {
    const routine = await request(app).post('/routines').send({ name: 'Push day', items: [] });
    const workout = await request(app).post('/workouts').send({ routineId: routine.body.id });

    await request(app).delete(`/routines/${routine.body.id}`);

    const res = await request(app).get(`/workouts/${workout.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.routineId).toBeNull();
  });
});
