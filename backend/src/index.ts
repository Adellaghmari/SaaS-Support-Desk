import express from 'express';
import cors, { type CorsOptions } from 'cors';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import { initDatabase } from './config/initDatabase';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL?.replace(/\/$/, ''),
].filter((origin): origin is string => Boolean(origin));

function isAllowedVercelPreview(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);

    return (
      hostname === 'saas-support-desk.vercel.app' ||
      (hostname.startsWith('saas-support-desk-') && hostname.endsWith('.vercel.app'))
    );
  } catch {
    return false;
  }
}

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || isAllowedVercelPreview(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

async function start() {
  await initDatabase();

  const { default: routes } = await import('./routes');

  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json());

  const healthPayload = { status: 'ok', service: 'SaaS Support Desk API' };

  app.get('/health', (_req: Request, res: Response) => {
    res.json(healthPayload);
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json(healthPayload);
  });

  app.use('/api', routes);
  app.use(errorHandler);

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`SaaS Support Desk API running on port ${PORT}`);
  });
}

start().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
