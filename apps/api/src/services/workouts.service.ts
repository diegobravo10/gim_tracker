import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/httpError.js';
import type { CreateWorkoutInput, ListWorkoutsQuery } from '../schemas/workout.schema.js';

const WORKOUT_DETAIL_INCLUDE = {
  exercises: {
    orderBy: { order: 'asc' },
    include: {
      exercise: true,
      sets: { orderBy: { order: 'asc' } },
    },
  },
} satisfies Prisma.WorkoutInclude;

async function assertNoActiveWorkout() {
  const active = await prisma.workout.findFirst({ where: { finishedAt: null } });
  if (active) {
    throw HttpError.conflict('ACTIVE_WORKOUT_EXISTS', 'Ya hay un entreno activo.');
  }
}

export async function createWorkout(data: CreateWorkoutInput) {
  await assertNoActiveWorkout();

  let routineItems: { exerciseId: string; order: number }[] = [];
  if (data.routineId) {
    const routine = await prisma.routine.findUnique({
      where: { id: data.routineId },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    if (!routine) {
      throw HttpError.notFound('La rutina no existe.');
    }
    routineItems = routine.items.map((item, index) => ({
      exerciseId: item.exerciseId,
      order: index,
    }));
  }

  return prisma.workout.create({
    data: {
      routineId: data.routineId,
      startedAt: new Date(),
      exercises: routineItems.length > 0 ? { create: routineItems } : undefined,
    },
    include: WORKOUT_DETAIL_INCLUDE,
  });
}

export async function getActiveWorkout() {
  const workout = await prisma.workout.findFirst({
    where: { finishedAt: null },
    include: WORKOUT_DETAIL_INCLUDE,
  });
  if (!workout) {
    throw new HttpError(404, 'NO_ACTIVE_WORKOUT', 'No hay un entreno activo.');
  }
  return workout;
}

export async function getWorkout(id: string) {
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: WORKOUT_DETAIL_INCLUDE,
  });
  if (!workout) {
    throw HttpError.notFound('El entreno no existe.');
  }
  return workout;
}

export function listWorkouts(query: ListWorkoutsQuery) {
  const { from, to } = query;
  return prisma.workout.findMany({
    where: {
      startedAt: {
        gte: from,
        lte: to,
      },
    },
    orderBy: { startedAt: 'desc' },
  });
}

export async function finishWorkout(id: string) {
  const workout = await prisma.workout.findUnique({ where: { id } });
  if (!workout) {
    throw HttpError.notFound('El entreno no existe.');
  }
  if (workout.finishedAt) {
    throw HttpError.conflict('ALREADY_FINISHED', 'El entreno ya está terminado.');
  }
  return prisma.workout.update({
    where: { id },
    data: { finishedAt: new Date() },
    include: WORKOUT_DETAIL_INCLUDE,
  });
}

export async function deleteWorkout(id: string) {
  await getWorkout(id);
  await prisma.workout.delete({ where: { id } });
}

export async function addExerciseToWorkout(workoutId: string, exerciseId: string) {
  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!workout) {
    throw HttpError.notFound('El entreno no existe.');
  }

  const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (!exercise) {
    throw HttpError.notFound('El ejercicio no existe.');
  }

  const lastExercise = await prisma.workoutExercise.findFirst({
    where: { workoutId },
    orderBy: { order: 'desc' },
  });
  const order = lastExercise ? lastExercise.order + 1 : 0;

  return prisma.workoutExercise.create({
    data: { workoutId, exerciseId, order },
    include: { exercise: true, sets: true },
  });
}
