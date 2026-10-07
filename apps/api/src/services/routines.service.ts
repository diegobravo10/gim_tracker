import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/httpError.js';
import type {
  CreateRoutineInput,
  UpdateRoutineInput,
  routineItemSchema,
} from '../schemas/routine.schema.js';
import type { z } from 'zod';

const ROUTINE_INCLUDE = {
  items: {
    orderBy: { order: 'asc' },
    include: { exercise: true },
  },
} satisfies Prisma.RoutineInclude;

async function assertExercisesExist(exerciseIds: string[]) {
  const unique = [...new Set(exerciseIds)];
  if (unique.length === 0) return;
  const found = await prisma.exercise.findMany({
    where: { id: { in: unique } },
    select: { id: true },
  });
  if (found.length !== unique.length) {
    throw new HttpError(400, 'INVALID_EXERCISE', 'Uno o más ejercicios de la rutina no existen.');
  }
}

function toItemCreateInput(items: z.infer<typeof routineItemSchema>[]) {
  return items.map((item, index) => ({
    exerciseId: item.exerciseId,
    order: index,
    targetSets: item.targetSets,
    targetReps: item.targetReps,
  }));
}

export function listRoutines() {
  return prisma.routine.findMany({ orderBy: { name: 'asc' }, include: ROUTINE_INCLUDE });
}

export async function getRoutine(id: string) {
  const routine = await prisma.routine.findUnique({ where: { id }, include: ROUTINE_INCLUDE });
  if (!routine) {
    throw HttpError.notFound('La rutina no existe.');
  }
  return routine;
}

export async function createRoutine(data: CreateRoutineInput) {
  await assertExercisesExist(data.items.map((item) => item.exerciseId));

  return prisma.routine.create({
    data: {
      name: data.name,
      items: { create: toItemCreateInput(data.items) },
    },
    include: ROUTINE_INCLUDE,
  });
}

export async function updateRoutine(id: string, data: UpdateRoutineInput) {
  await getRoutine(id);
  if (data.items) {
    await assertExercisesExist(data.items.map((item) => item.exerciseId));
  }

  return prisma.$transaction(async (tx) => {
    if (data.items) {
      await tx.routineItem.deleteMany({ where: { routineId: id } });
    }
    return tx.routine.update({
      where: { id },
      data: {
        name: data.name,
        items: data.items ? { create: toItemCreateInput(data.items) } : undefined,
      },
      include: ROUTINE_INCLUDE,
    });
  });
}

export async function deleteRoutine(id: string) {
  await getRoutine(id);
  await prisma.routine.delete({ where: { id } });
}
