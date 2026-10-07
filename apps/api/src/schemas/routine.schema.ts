import { z } from 'zod';

export const routineItemSchema = z.object({
  exerciseId: z.string().trim().min(1, 'exerciseId es obligatorio.'),
  targetSets: z.number().int().positive().optional(),
  targetReps: z.number().int().positive().optional(),
});

export const createRoutineSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.'),
  items: z.array(routineItemSchema).default([]),
});

export const updateRoutineSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    items: z.array(routineItemSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe incluir al menos un campo para actualizar.',
  });

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
