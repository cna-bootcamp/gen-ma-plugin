import { Router } from 'express';
import { getAllPlugins, addPlugin, removePlugin, validatePluginDir } from '../services/plugin-manager.js';

export const pluginsRouter = Router();

// GET /api/plugins - List all registered plugins
pluginsRouter.get('/', async (_req, res) => {
  try {
    const plugins = await getAllPlugins();
    res.json(plugins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/plugins - Add a new plugin
pluginsRouter.post('/', async (req, res) => {
  const { projectDir, displayNames } = req.body as {
    projectDir: string;
    displayNames: { ko: string; en: string };
  };

  if (!projectDir || !displayNames) {
    res.status(400).json({ error: 'projectDir and displayNames are required' });
    return;
  }

  try {
    const plugin = await addPlugin(projectDir, displayNames);
    res.status(201).json(plugin);
  } catch (error: any) {
    const status = error.message === 'already_registered' ? 409 : 400;
    res.status(status).json({ error: error.message });
  }
});

// POST /api/plugins/validate - Validate a plugin directory
pluginsRouter.post('/validate', async (req, res) => {
  const { projectDir } = req.body as { projectDir: string };

  if (!projectDir) {
    res.status(400).json({ valid: false, error: 'projectDir is required' });
    return;
  }

  const result = await validatePluginDir(projectDir);
  res.json(result);
});

// DELETE /api/plugins/:id - Remove a plugin
pluginsRouter.delete('/:id', async (req, res) => {
  try {
    await removePlugin(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    const status = error.message === 'cannot_remove_default' ? 403 : 404;
    res.status(status).json({ error: error.message });
  }
});
