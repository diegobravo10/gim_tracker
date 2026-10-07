import { Router } from 'express';
import { createSetSchema } from '../schemas/set.schema.js';
import * as workoutExercisesService from '../services/workoutExercises.service.js';

export const workoutExercisesRouter = Router();

workoutExercisesRouter.delete('/:id', async (req, res) => {
  await workoutExercisesService.deleteWorkoutExercise(req.params.id);
  res.status(204).end();
});

workoutExercisesRouter.post('/:id/sets', async (req, res) => {
  const data = createSetSchema.parse(req.body);
  const set = await workoutExercisesService.addSetToWorkoutExercise(req.params.id, data);
  res.status(201).json(set);
});
