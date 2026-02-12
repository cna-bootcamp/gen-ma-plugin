import { Router } from 'express';
import { readFile } from 'fs/promises';
import path from 'path';
import { DMAP_PROJECT_DIR } from '../config.js';

export const infoRouter = Router();

infoRouter.get('/', async (_req, res) => {
  try {
    const pluginJson = JSON.parse(
      await readFile(path.join(DMAP_PROJECT_DIR, '.claude-plugin', 'plugin.json'), 'utf-8'),
    );
    res.json({
      name: pluginJson.name || 'dmap',
      version: pluginJson.version || '0.0.0',
      description: pluginJson.description || '',
      author: pluginJson.author?.name || '',
    });
  } catch {
    res.json({ name: 'dmap', version: '0.0.0', description: '', author: '' });
  }
});
