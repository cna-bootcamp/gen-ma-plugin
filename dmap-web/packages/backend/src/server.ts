import express from 'express';
import cors from 'cors';
import { PORT, DMAP_PROJECT_DIR } from './config.js';
import { healthRouter } from './routes/health.js';
import { skillsRouter } from './routes/skills.js';
import { sessionsRouter } from './routes/sessions.js';
import { infoRouter } from './routes/info.js';
import { startupRouter } from './routes/startup.js';
import { pluginsRouter } from './routes/plugins.js';
import { filesystemRouter } from './routes/filesystem.js';
import { transcriptsRouter } from './routes/transcripts.js';
import { errorHandler } from './middleware/error-handler.js';
import { createLogger } from './utils/logger.js';

const log = createLogger('Server');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}));
app.use(express.json());

// Routes
app.use('/', healthRouter);
app.use('/api/info', infoRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/startup-check', startupRouter);
app.use('/api/plugins', pluginsRouter);
app.use('/api/filesystem', filesystemRouter);
app.use('/api/transcripts', transcriptsRouter);

// Error handler (must be last)
app.use(errorHandler);

const server = app.listen(PORT, () => {
  log.info(`Backend running on http://localhost:${PORT}`);
  log.info(`DMAP project dir: ${DMAP_PROJECT_DIR}`);
});

function gracefulShutdown(signal: string) {
  log.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    log.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    log.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
