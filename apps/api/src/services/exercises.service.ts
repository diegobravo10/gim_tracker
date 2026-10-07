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

// Epley: 1RM estimado = peso x (1 + reps/30).
function estimateOneRepMax(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

interface WorkoutProgressPoint {
  workoutId: string;
  startedAt: Date;
  maxWeightKg: number;
  estimated1RM: number;
  volumeKg: number;
}

type ProgressMetric = 'maxWeightKg' | 'estimated1RM' | 'volumeKg';

function findPR(points: WorkoutProgressPoint[], metric: ProgressMetric) {
  return points.reduce<WorkoutProgressPoint | null>((best, point) => {
    if (!best || point[metric] > best[metric]) return point;
    return best;
  }, null);
}

function toPRSummary(point: WorkoutProgressPoint | null, metric: ProgressMetric) {
  if (!point) return null;
  return { value: point[metric], workoutId: point.workoutId, startedAt: point.startedAt };
}

export async function getExerciseProgress(id: string) {
  await getExercise(id);

  // PRs se calculan sobre series de trabajo ya confirmadas: sin
  // calentamientos (igual que el volumen del Historial, Fase 3) y
  // marcadas como completadas, para que el badge de PR en el entreno
  // activo solo reaccione a series que el usuario ya dio por hechas.
  const workoutExercises = await prisma.workoutExercise.findMany({
    where: { exerciseId: id },
    include: {
      workout: true,
      sets: { where: { isWarmup: false, completed: true } },
    },
    orderBy: { workout: { startedAt: 'asc' } },
  });

  const byWorkout: WorkoutProgressPoint[] = workoutExercises
    .filter((we) => we.sets.length > 0)
    .map((we) => ({
      workoutId: we.workoutId,
      startedAt: we.workout.startedAt,
      maxWeightKg: Math.max(...we.sets.map((set) => set.weightKg)),
      estimated1RM:
        Math.round(Math.max(...we.sets.map((set) => estimateOneRepMax(set.weightKg, set.reps))) * 10) /
        10,
      volumeKg: we.sets.reduce((sum, set) => sum + set.weightKg * set.reps, 0),
    }));

  return {
    byWorkout,
    prs: {
      maxWeight: toPRSummary(findPR(byWorkout, 'maxWeightKg'), 'maxWeightKg'),
      estimated1RM: toPRSummary(findPR(byWorkout, 'estimated1RM'), 'estimated1RM'),
      volume: toPRSummary(findPR(byWorkout, 'volumeKg'), 'volumeKg'),
    },
  };
}
