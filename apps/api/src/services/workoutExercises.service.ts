import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/httpError.js';
import type { CreateSetInput } from '../schemas/set.schema.js';

async function getWorkoutExerciseOrThrow(id: string) {
  const workoutExercise = await prisma.workoutExercise.findUnique({ where: { id } });
  if (!workoutExercise) {
    throw HttpError.notFound('El ejercicio del entreno no existe.');
  }
  return workoutExercise;
}

export async function deleteWorkoutExercise(id: string) {
  await getWorkoutExerciseOrThrow(id);
  await prisma.workoutExercise.delete({ where: { id } });
}

export async function addSetToWorkoutExercise(workoutExerciseId: string, data: CreateSetInput) {
  await getWorkoutExerciseOrThrow(workoutExerciseId);

  const lastSet = await prisma.workoutSet.findFirst({
    where: { workoutExerciseId },
    orderBy: { order: 'desc' },
  });
  const order = lastSet ? lastSet.order + 1 : 0;

  return prisma.workoutSet.create({
    data: {
      workoutExerciseId,
      order,
      weightKg: data.weightKg,
      reps: data.reps,
      isWarmup: data.isWarmup ?? false,
    },
  });
}
