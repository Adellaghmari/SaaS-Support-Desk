import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

function isDatabaseError(err: Error): boolean {
  const code = (err as NodeJS.ErrnoException).code;
  return code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === '57P01' || err.message.includes('connect');
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (isDatabaseError(err)) {
    res.status(503).json({
      error: 'Database connection failed. Please check that PostgreSQL is running or restart the backend.',
    });
    return;
  }

  if (err.message.includes('Database not initialized')) {
    res.status(503).json({
      error: 'Backend is still starting up. Please wait a moment and refresh.',
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
