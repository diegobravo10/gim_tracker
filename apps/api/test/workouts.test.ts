import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp();

describe('/workouts', () => {
  it('crea un entreno', async () => {
    const res = await request(app).post('/workouts').send({});

    expect(res.status).toBe(201);
    expect(res.body.finishedAt).toBeNull();
    expect(res.body.exercises).toEqual([]);
  });

  it('devuelve 409 si ya hay un entreno activo', async () => {
    await request(app).post('/workouts').send({});
    const res = await request(app).post('/workouts').send({});

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ACTIVE_WORKOUT_EXISTS');
  });

  it('precarga los ejercicios de la rutina indicada', async () => {
    const [benchPress, squat] = await Promise.all([
      prisma.exercise.create({ data: { name: 'Press de banca', muscleGroup: 'Pecho' } }),
      prisma.exercise.create({ data: { name: 'Sentadilla', muscleGroup: 'Piernas' } }),
    ]);
    const routine = await prisma.routine.create({
      data: {
        name: 'Push day',
        items: {
          create: [
            { exerciseId: benchPress.id, order: 0 },
            { exerciseId: squat.id, order: 1 },
          ],
        },
      },
    });

    const res = await request(app).post('/workouts').send({ routineId: routine.id });

    expect(res.status).toBe(201);
    expect(res.body.exercises).toHaveLength(2);
    expect(res.body.exercises[0].exercise.name).toBe('Press de banca');
    expect(res.body.exercises[1].exercise.name).toBe('Sentadilla');
  });

  it('devuelve 404 si la rutina no existe', async () => {
    const res = await request(app).post('/workouts').send({ routineId: 'no-existe' });
    expect(res.status).toBe(404);
  });

  it('GET /workouts/active devuelve 404 cuando no hay entreno activo', async () => {
    const res = await request(app).get('/workouts/active');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NO_ACTIVE_WORKOUT');
  });

  it('GET /workouts/active devuelve el entreno en curso', async () => {
    const created = await request(app).post('/workouts').send({});
    const res = await request(app).get('/workouts/active');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it('termina un entreno activo', async () => {
    const created = await request(app).post('/workouts').send({});

    const res = await request(app).patch(`/workouts/${created.body.id}/finish`);

    expect(res.status).toBe(200);
    expect(res.body.finishedAt).not.toBeNull();
  });

  it('devuelve 409 al terminar un entreno ya terminado', async () => {
    const created = await request(app).post('/workouts').send({});
    await request(app).patch(`/workouts/${created.body.id}/finish`);

    const res = await request(app).patch(`/workouts/${created.body.id}/finish`);
    expect(res.status).toBe(409);
  });

  it('devuelve 404 al terminar un entreno inexistente', async () => {
    const res = await request(app).patch('/workouts/no-existe/finish');
    expect(res.status).toBe(404);
  });

  it('lista entrenos filtrando por rango de fechas', async () => {
    const old = await prisma.workout.create({
      data: { startedAt: new Date('2020-01-01T00:00:00Z'), finishedAt: new Date('2020-01-01T01:00:00Z') },
    });
    const recent = await request(app).post('/workouts').send({});
    await request(app).patch(`/workouts/${recent.body.id}/finish`);

    const res = await request(app)
      .get('/workouts')
      .query({ from: '2024-01-01', to: '2030-01-01' });

    const ids = res.body.map((w: { id: string }) => w.id);
    expect(ids).toContain(recent.body.id);
    expect(ids).not.toContain(old.id);
  });

  it('calcula el volumen total sin contar calentamientos', async () => {
    const exercise = await prisma.exercise.create({
      data: { name: 'Press de banca', muscleGroup: 'Pecho' },
    });
    const created = await request(app).post('/workouts').send({});
    const workoutExercise = await request(app)
      .post(`/workouts/${created.body.id}/exercises`)
      .send({ exerciseId: exercise.id });
    await request(app)
      .post(`/workout-exercises/${workoutExercise.body.id}/sets`)
      .send({ weightKg: 20, reps: 15, isWarmup: true });
    await request(app)
      .post(`/workout-exercises/${workoutExercise.body.id}/sets`)
      .send({ weightKg: 60, reps: 8 });
    await request(app)
      .post(`/workout-exercises/${workoutExercise.body.id}/sets`)
      .send({ weightKg: 60, reps: 8 });

    const list = await request(app).get('/workouts');
    const summary = list.body.find((w: { id: string }) => w.id === created.body.id);

    expect(summary.totalVolumeKg).toBe(60 * 8 * 2);
    expect(summary.exercises).toEqual([{ id: exercise.id, name: exercise.name }]);

    const detail = await request(app).get(`/workouts/${created.body.id}`);
    expect(detail.body.totalVolumeKg).toBe(60 * 8 * 2);
  });

  it('obtiene el detalle de un entreno', async () => {
    const created = await request(app).post('/workouts').send({});

    const res = await request(app).get(`/workouts/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.exercises).toEqual([]);
  });

  it('devuelve 404 al pedir un entreno inexistente', async () => {
    const res = await request(app).get('/workouts/no-existe');
    expect(res.status).toBe(404);
  });

  it('elimina un entreno', async () => {
    const created = await request(app).post('/workouts').send({});

    const res = await request(app).delete(`/workouts/${created.body.id}`);
    expect(res.status).toBe(204);

    const after = await request(app).get(`/workouts/${created.body.id}`);
    expect(after.status).toBe(404);
  });
});
