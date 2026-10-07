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

export async function getLastExerciseSets(id: string) {
  await getExercise(id);

  const lastWorkoutExercise = await prisma.workoutExercise.findFirst({
    where: { exerciseId: id, workout: { finishedAt: { not: null } } },
    orderBy: { workout: { startedAt: 'desc' } },
    include: { sets: { orderBy: { order: 'asc' } }, workout: true },
  });

  if (!lastWorkoutExercise) {
    throw new HttpError(404, 'NO_PREVIOUS_DATA', 'No hay un entreno previo con este ejercicio.');
  }

  return {
    workoutId: lastWorkoutExercise.workoutId,
    startedAt: lastWorkoutExercise.workout.startedAt,
    sets: lastWorkoutExercise.sets.map((set) => ({
      order: set.order,
      weightKg: set.weightKg,
      reps: set.reps,
      isWarmup: set.isWarmup,
    })),
  };
}
