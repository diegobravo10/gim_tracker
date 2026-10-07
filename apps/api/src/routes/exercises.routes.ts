import { Router } from 'express';
import {
  createExerciseSchema,
  listExercisesQuerySchema,
  updateExerciseSchema,
} from '../schemas/exercise.schema.js';
import * as exercisesService from '../services/exercises.service.js';

export const exercisesRouter = Router();

exercisesRouter.get('/', async (req, res) => {
  const { q } = listExercisesQuerySchema.parse(req.query);
  const exercises = await exercisesService.listExercises(q);
  res.json(exercises);
});

exercisesRouter.post('/', async (req, res) => {
  const data = createExerciseSchema.parse(req.body);
  const exercise = await exercisesService.createExercise(data);
  res.status(201).json(exercise);
});

exercisesRouter.get('/:id', async (req, res) => {
  const exercise = await exercisesService.getExercise(req.params.id);
  res.json(exercise);
});

exercisesRouter.patch('/:id', async (req, res) => {
  const data = updateExerciseSchema.parse(req.body);
  const exercise = await exercisesService.updateExercise(req.params.id, data);
  res.json(exercise);
});

exercisesRouter.delete('/:id', async (req, res) => {
  await exercisesService.deleteExercise(req.params.id);
  res.status(204).end();
});
