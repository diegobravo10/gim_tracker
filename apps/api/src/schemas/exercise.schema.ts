import { z } from 'zod';

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.'),
  muscleGroup: z.string().trim().min(1, 'El grupo muscular es obligatorio.'),
});

export const updateExerciseSchema = createExerciseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe incluir al menos un campo para actualizar.',
  });

export const listExercisesQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
