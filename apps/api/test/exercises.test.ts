import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp();

describe('/exercises', () => {
  it('crea un ejercicio', async () => {
    const res = await request(app)
      .post('/exercises')
      .send({ name: 'Press de banca', muscleGroup: 'Pecho' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Press de banca', muscleGroup: 'Pecho' });
  });

  it('rechaza un ejercicio sin nombre', async () => {
    const res = await request(app).post('/exercises').send({ muscleGroup: 'Pecho' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('rechaza nombres duplicados', async () => {
    await request(app).post('/exercises').send({ name: 'Sentadilla', muscleGroup: 'Piernas' });
    const res = await request(app)
      .post('/exercises')
      .send({ name: 'Sentadilla', muscleGroup: 'Piernas' });

    expect(res.status).toBe(409);
  });

  it('lista y busca por nombre con ?q=', async () => {
    await prisma.exercise.createMany({
      data: [
        { name: 'Curl con barra', muscleGroup: 'Bíceps' },
        { name: 'Curl martillo', muscleGroup: 'Bíceps' },
        { name: 'Remo con barra', muscleGroup: 'Espalda' },
      ],
    });

    const all = await request(app).get('/exercises');
    expect(all.body).toHaveLength(3);

    const filtered = await request(app).get('/exercises').query({ q: 'curl' });
    expect(filtered.body).toHaveLength(2);
  });

  it('devuelve 404 al buscar un ejercicio inexistente', async () => {
    const res = await request(app).get('/exercises/no-existe');
    expect(res.status).toBe(404);
  });

  it('actualiza un ejercicio', async () => {
    const created = await prisma.exercise.create({
      data: { name: 'Zancadas', muscleGroup: 'Piernas' },
    });

    const res = await request(app)
      .patch(`/exercises/${created.id}`)
      .send({ muscleGroup: 'Glúteos' });

    expect(res.status).toBe(200);
    expect(res.body.muscleGroup).toBe('Glúteos');
  });

  it('rechaza un PATCH con body vacío', async () => {
    const created = await prisma.exercise.create({
      data: { name: 'Hip thrust', muscleGroup: 'Glúteos' },
    });

    const res = await request(app).patch(`/exercises/${created.id}`).send({});
    expect(res.status).toBe(400);
  });

  it('elimina un ejercicio sin uso', async () => {
    const created = await prisma.exercise.create({
      data: { name: 'Plancha', muscleGroup: 'Core' },
    });

    const res = await request(app).delete(`/exercises/${created.id}`);
    expect(res.status).toBe(204);
  });

  it('devuelve 409 al eliminar un ejercicio en uso', async () => {
    const exercise = await prisma.exercise.create({
      data: { name: 'Peso muerto', muscleGroup: 'Espalda' },
    });
    const workout = await prisma.workout.create({ data: {} });
    await prisma.workoutExercise.create({
      data: { workoutId: workout.id, exerciseId: exercise.id, order: 0 },
    });

    const res = await request(app).delete(`/exercises/${exercise.id}`);
    expect(res.status).toBe(409);
  });
});
