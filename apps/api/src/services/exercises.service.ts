import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/httpError.js';
import type { CreateExerciseInput, UpdateExerciseInput } from '../schemas/exercise.schema.js';

export function listExercises(q?: string) {
  return prisma.exercise.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
    orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
  });
}

export async function getExercise(id: string) {
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) {
    throw HttpError.notFound('El ejercicio no existe.');
  }
  return exercise;
}

export function createExercise(data: CreateExerciseInput) {
  return prisma.exercise.create({ data });
}

export async function updateExercise(id: string, data: UpdateExerciseInput) {
  await getExercise(id);
  return prisma.exercise.update({ where: { id }, data });
}

export async function deleteExercise(id: string) {
  await getExercise(id);
  await prisma.exercise.delete({ where: { id } });
}
