import { z } from 'zod';

export const createSetSchema = z.object({
  weightKg: z.number().nonnegative('El peso no puede ser negativo.'),
  reps: z.number().int().nonnegative('Las repeticiones no pueden ser negativas.'),
  isWarmup: z.boolean().optional(),
});

export const updateSetSchema = z
  .object({
    weightKg: z.number().nonnegative().optional(),
    reps: z.number().int().nonnegative().optional(),
    isWarmup: z.boolean().optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe incluir al menos un campo para actualizar.',
  });

export type CreateSetInput = z.infer<typeof createSetSchema>;
export type UpdateSetInput = z.infer<typeof updateSetSchema>;
