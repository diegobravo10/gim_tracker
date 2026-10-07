import { Router } from 'express';
import { createRoutineSchema, updateRoutineSchema } from '../schemas/routine.schema.js';
import * as routinesService from '../services/routines.service.js';

export const routinesRouter = Router();

routinesRouter.get('/', async (_req, res) => {
  const routines = await routinesService.listRoutines();
  res.json(routines);
});

routinesRouter.post('/', async (req, res) => {
  const data = createRoutineSchema.parse(req.body);
  const routine = await routinesService.createRoutine(data);
  res.status(201).json(routine);
});

routinesRouter.get('/:id', async (req, res) => {
  const routine = await routinesService.getRoutine(req.params.id);
  res.json(routine);
});

routinesRouter.patch('/:id', async (req, res) => {
  const data = updateRoutineSchema.parse(req.body);
  const routine = await routinesService.updateRoutine(req.params.id, data);
  res.json(routine);
});

routinesRouter.delete('/:id', async (req, res) => {
  await routinesService.deleteRoutine(req.params.id);
  res.status(204).end();
});
