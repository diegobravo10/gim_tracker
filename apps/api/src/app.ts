import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { exercisesRouter } from './routes/exercises.routes.js';
import { routinesRouter } from './routes/routines.routes.js';
import { setsRouter } from './routes/sets.routes.js';
import { workoutExercisesRouter } from './routes/workoutExercises.routes.js';
import { workoutsRouter } from './routes/workouts.routes.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/exercises', exercisesRouter);
  app.use('/routines', routinesRouter);
  app.use('/workouts', workoutsRouter);
  app.use('/workout-exercises', workoutExercisesRouter);
  app.use('/sets', setsRouter);

  app.use(errorHandler);

  return app;
}
