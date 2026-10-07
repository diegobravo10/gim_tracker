import { Router } from 'express';
import { updateSetSchema } from '../schemas/set.schema.js';
import * as setsService from '../services/sets.service.js';

export const setsRouter = Router();

setsRouter.patch('/:id', async (req, res) => {
  const data = updateSetSchema.parse(req.body);
  const set = await setsService.updateSet(req.params.id, data);
  res.json(set);
});

setsRouter.delete('/:id', async (req, res) => {
  await setsService.deleteSet(req.params.id);
  res.status(204).end();
});
