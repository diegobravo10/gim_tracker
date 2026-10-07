import { z } from 'zod';

export const createWorkoutSchema = z.object({
  routineId: z.string().trim().min(1).optional(),
});

export const listWorkoutsQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: '"from" debe ser anterior o igual a "to".',
  });

export const addExerciseToWorkoutSchema = z.object({
  exerciseId: z.string().trim().min(1, 'exerciseId es obligatorio.'),
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
export type ListWorkoutsQuery = z.infer<typeof listWorkoutsQuerySchema>;
export type AddExerciseToWorkoutInput = z.infer<typeof addExerciseToWorkoutSchema>;
