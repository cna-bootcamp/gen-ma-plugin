import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'dmap-web-backend',
    dmapProjectDir: process.env.DMAP_PROJECT_DIR || 'not configured',
  });
});
