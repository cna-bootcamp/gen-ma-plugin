import { Router } from 'express';
import { getAllPlugins, addPlugin, removePlugin, validatePluginDir, resolveProjectDir, isSetupCompleted } from '../services/plugin-manager.js';
import { syncPluginAgents, removeRegisteredAgents } from '../services/agent-registry.js';

export const pluginsRouter = Router();

// GET /api/plugins - List all registered plugins
pluginsRouter.get('/', async (_req, res) => {
  try {
    const plugins = await getAllPlugins();
    // Inject setupCompleted flag for each plugin
    const enriched = await Promise.all(
      plugins.map(async (p, i) => ({
        ...p,
        setupCompleted: i === 0 ? true : await isSetupCompleted(p.projectDir),
      })),
    );
    res.json(enriched);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
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
    // Auto-sync plugin agents
    try { syncPluginAgents(plugin.id, plugin.projectDir); } catch { /* ignore sync errors */ }
    res.status(201).json(plugin);
  } catch (error: unknown) {
    const msg = (error as Error).message;
    const status = msg === 'already_registered' ? 409 : 400;
    res.status(status).json({ error: msg });
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

// POST /api/plugins/:id/agents/sync - Sync plugin agents from local project
pluginsRouter.post('/:id/agents/sync', async (req, res) => {
  try {
    const projectDir = await resolveProjectDir(req.params.id);
    const result = syncPluginAgents(req.params.id, projectDir);
    res.json({ success: true, count: result.count, agents: result.agents });
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE /api/plugins/:id - Remove a plugin
pluginsRouter.delete('/:id', async (req, res) => {
  try {
    await removePlugin(req.params.id);
    // Auto-remove registered agents
    try { removeRegisteredAgents(req.params.id); } catch { /* ignore */ }
    res.json({ success: true });
  } catch (error: unknown) {
    const msg = (error as Error).message;
    const status = msg === 'cannot_remove_default' ? 403 : 404;
    res.status(status).json({ error: msg });
  }
});
