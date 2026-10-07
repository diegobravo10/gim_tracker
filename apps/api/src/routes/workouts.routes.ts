import { Router } from 'express';
import {
  addExerciseToWorkoutSchema,
  createWorkoutSchema,
  listWorkoutsQuerySchema,
} from '../schemas/workout.schema.js';
import * as workoutsService from '../services/workouts.service.js';

export const workoutsRouter = Router();

workoutsRouter.post('/', async (req, res) => {
  const data = createWorkoutSchema.parse(req.body);
  const workout = await workoutsService.createWorkout(data);
  res.status(201).json(workout);
});

workoutsRouter.get('/active', async (_req, res) => {
  const workout = await workoutsService.getActiveWorkout();
  res.json(workout);
});

workoutsRouter.get('/', async (req, res) => {
  const query = listWorkoutsQuerySchema.parse(req.query);
  const workouts = await workoutsService.listWorkouts(query);
  res.json(workouts);
});

workoutsRouter.get('/:id', async (req, res) => {
  const workout = await workoutsService.getWorkout(req.params.id);
  res.json(workout);
});

workoutsRouter.delete('/:id', async (req, res) => {
  await workoutsService.deleteWorkout(req.params.id);
  res.status(204).end();
});

workoutsRouter.patch('/:id/finish', async (req, res) => {
  const workout = await workoutsService.finishWorkout(req.params.id);
  res.json(workout);
});

workoutsRouter.post('/:id/exercises', async (req, res) => {
  const data = addExerciseToWorkoutSchema.parse(req.body);
  const workoutExercise = await workoutsService.addExerciseToWorkout(
    req.params.id,
    data.exerciseId,
  );
  res.status(201).json(workoutExercise);
});
