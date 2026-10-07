import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/httpError.js';
import type { UpdateSetInput } from '../schemas/set.schema.js';

async function getSetOrThrow(id: string) {
  const set = await prisma.workoutSet.findUnique({ where: { id } });
  if (!set) {
    throw HttpError.notFound('La serie no existe.');
  }
  return set;
}

export async function updateSet(id: string, data: UpdateSetInput) {
  await getSetOrThrow(id);

  const completedAt =
    data.completed === undefined ? undefined : data.completed ? new Date() : null;

  return prisma.workoutSet.update({
    where: { id },
    data: { ...data, completedAt },
  });
}

export async function deleteSet(id: string) {
  await getSetOrThrow(id);
  await prisma.workoutSet.delete({ where: { id } });
}
