import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/httpError.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Datos inválidos.',
      details: formatZodError(err),
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.code, message: err.message });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'DUPLICATE', message: 'El recurso ya existe.' });
      return;
    }
    if (err.code === 'P2003') {
      res.status(409).json({ error: 'IN_USE', message: 'El recurso está en uso y no se puede eliminar.' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Recurso no encontrado.' });
      return;
    }
  }

  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error interno del servidor.' });
}

function formatZodError(err: ZodError) {
  return err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
}
