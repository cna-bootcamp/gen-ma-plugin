import { readFile, writeFile, access } from 'fs/promises';
import path from 'path';
import { DMAP_PROJECT_DIR, DATA_DIR } from '../config.js';
import type { PluginInfo } from '@dmap-web/shared';

const PLUGINS_FILE = path.join(DATA_DIR, 'plugins.json');

interface StoredPlugin {
  projectDir: string;
  displayNames: { ko: string; en: string };
}

// Read plugin.json from a plugin directory
async function readPluginJson(projectDir: string): Promise<{ name: string; version: string; description: string } | null> {
  try {
    const raw = await readFile(path.join(projectDir, '.claude-plugin', 'plugin.json'), 'utf-8');
    const json = JSON.parse(raw);
    return {
      name: json.name || path.basename(projectDir),
      version: json.version || '0.0.0',
      description: json.description || '',
    };
  } catch {
    return null;
  }
}

// Validate a plugin directory
export async function validatePluginDir(projectDir: string): Promise<{ valid: boolean; error?: string; name?: string }> {
  try {
    await access(projectDir);
  } catch {
    return { valid: false, error: 'directory_not_found' };
  }

  const pluginJson = await readPluginJson(projectDir);
  if (!pluginJson) {
    return { valid: false, error: 'no_plugin_json' };
  }

  try {
    await access(path.join(projectDir, 'skills'));
  } catch {
    return { valid: false, error: 'no_skills_dir' };
  }

  return { valid: true, name: pluginJson.name };
}

// Load registered plugins from plugins.json
async function loadRegisteredPlugins(): Promise<StoredPlugin[]> {
  try {
    const raw = await readFile(PLUGINS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    // Migrate old format (string[]) to new format (StoredPlugin[])
    return data.map((item: unknown) =>
      typeof item === 'string'
        ? { projectDir: item, displayNames: { ko: path.basename(item), en: path.basename(item) } }
        : item as StoredPlugin,
    );
  } catch {
    return [];
  }
}

// Save registered plugins
async function saveRegisteredPlugins(plugins: StoredPlugin[]): Promise<void> {
  await writeFile(PLUGINS_FILE, JSON.stringify(plugins, null, 2), 'utf-8');
}

// Get all plugins (DMAP default + registered)
export async function getAllPlugins(): Promise<PluginInfo[]> {
  const plugins: PluginInfo[] = [];

  // Default DMAP plugin (always first)
  const dmapJson = await readPluginJson(DMAP_PROJECT_DIR);
  plugins.push({
    id: dmapJson?.name || 'dmap',
    name: dmapJson?.name || 'dmap',
    displayNames: { ko: 'DMAP 빌더', en: 'DMAP Builder' },
    description: dmapJson?.description || '',
    version: dmapJson?.version || '0.0.0',
    projectDir: DMAP_PROJECT_DIR,
  });

  // Registered plugins
  const registeredPlugins = await loadRegisteredPlugins();
  for (const entry of registeredPlugins) {
    // Skip if same as DMAP dir
    if (path.resolve(entry.projectDir) === path.resolve(DMAP_PROJECT_DIR)) continue;

    const json = await readPluginJson(entry.projectDir);
    if (json) {
      plugins.push({
        id: json.name,
        name: json.name,
        displayNames: entry.displayNames,
        description: json.description,
        version: json.version,
        projectDir: entry.projectDir,
      });
    }
  }

  return plugins;
}

// Add a plugin
export async function addPlugin(
  projectDir: string,
  displayNames: { ko: string; en: string },
): Promise<PluginInfo> {
  const resolved = path.resolve(projectDir);

  // Validate
  const validation = await validatePluginDir(resolved);
  if (!validation.valid) {
    throw new Error(validation.error || 'invalid_plugin');
  }

  // Check duplicate directory
  const existing = await getAllPlugins();
  if (existing.some((p) => path.resolve(p.projectDir) === resolved)) {
    throw new Error('already_registered');
  }

  // Check duplicate name
  const json = await readPluginJson(resolved);
  if (!json) throw new Error('no_plugin_json');
  if (existing.some((p) => p.id === json.name)) {
    throw new Error('already_registered');
  }

  // Save
  const storedPlugins = await loadRegisteredPlugins();
  storedPlugins.push({ projectDir: resolved, displayNames });
  await saveRegisteredPlugins(storedPlugins);

  return {
    id: json.name,
    name: json.name,
    displayNames,
    description: json.description,
    version: json.version,
    projectDir: resolved,
  };
}

// Remove a plugin
export async function removePlugin(pluginId: string): Promise<void> {
  const plugins = await getAllPlugins();
  const plugin = plugins.find((p) => p.id === pluginId);

  if (!plugin) throw new Error('not_found');
  if (path.resolve(plugin.projectDir) === path.resolve(DMAP_PROJECT_DIR)) {
    throw new Error('cannot_remove_default');
  }

  const storedPlugins = await loadRegisteredPlugins();
  const filtered = storedPlugins.filter((p) => path.resolve(p.projectDir) !== path.resolve(plugin.projectDir));
  await saveRegisteredPlugins(filtered);
}

// Resolve pluginId to projectDir
export async function resolveProjectDir(pluginId?: string): Promise<string> {
  if (!pluginId) return DMAP_PROJECT_DIR;

  const plugins = await getAllPlugins();
  const plugin = plugins.find((p) => p.id === pluginId);
  return plugin?.projectDir || DMAP_PROJECT_DIR;
}
