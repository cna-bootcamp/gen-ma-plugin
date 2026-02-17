/**
 * 플러그인 관리자 - DMAP 플러그인의 등록/해제/조회를 관리
 *
 * 플러그인 구조:
 * - 기본 DMAP 플러그인: DMAP_PROJECT_DIR (항상 첫 번째, 삭제 불가)
 * - 외부 플러그인: plugins.json에 등록된 프로젝트 경로 목록
 *
 * 플러그인 디렉토리 요구사항:
 * - .claude-plugin/plugin.json (name, version, description)
 * - skills/ 디렉토리 (SKILL.md 파일 포함)
 * - .dmap/setup-completed (설정 완료 마커)
 *
 * @module plugin-manager
 */
import { readFile, writeFile, access, mkdir } from 'fs/promises';
import path from 'path';
import { DMAP_PROJECT_DIR, DATA_DIR } from '../config.js';
import type { PluginInfo } from '@dmap-web/shared';

const PLUGINS_FILE = path.join(DATA_DIR, 'plugins.json');

/** plugins.json에 저장되는 플러그인 엔트리 - 프로젝트 경로 + 다국어 표시명 */
interface StoredPlugin {
  projectDir: string;
  displayNames: { ko: string; en: string };
}

/** 플러그인 디렉토리에서 .claude-plugin/plugin.json 읽기 - 메타데이터(name, version, description) 추출 */
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

/** 플러그인 디렉토리 유효성 검증 - 디렉토리 존재 + plugin.json + skills/ 디렉토리 확인 */
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

/** 플러그인 목록을 plugins.json에서 로드 - 구 형식(string[]) → 신 형식(StoredPlugin[]) 자동 마이그레이션 */
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

/** 플러그인 목록을 plugins.json에 저장 */
// Save registered plugins
async function saveRegisteredPlugins(plugins: StoredPlugin[]): Promise<void> {
  await writeFile(PLUGINS_FILE, JSON.stringify(plugins, null, 2), 'utf-8');
}

/** 전체 플러그인 목록 반환 - DMAP 기본 플러그인(항상 첫 번째) + 등록된 외부 플러그인 */
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

/** 새 플러그인 등록 - 유효성 검증 + 중복 체크(경로 및 이름) + plugins.json에 추가 */
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

/** 플러그인 등록 해제 - 기본 DMAP 플러그인은 삭제 불가 */
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

/** pluginId → projectDir 변환 - pluginId 없으면 기본 DMAP 프로젝트 경로 반환 */
// Resolve pluginId to projectDir
export async function resolveProjectDir(pluginId?: string): Promise<string> {
  if (!pluginId) return DMAP_PROJECT_DIR;

  const plugins = await getAllPlugins();
  const plugin = plugins.find((p) => p.id === pluginId);
  return plugin?.projectDir || DMAP_PROJECT_DIR;
}

/** 플러그인 초기 설정 완료 여부 확인 - .dmap/setup-completed 마커 파일 존재 여부 */
// Check if plugin setup has been completed
export async function isSetupCompleted(projectDir: string): Promise<boolean> {
  try {
    await access(path.join(projectDir, '.dmap', 'setup-completed'));
    return true;
  } catch {
    return false;
  }
}

/** 플러그인 초기 설정 완료 마킹 - .dmap/setup-completed 파일 생성 */
// Mark plugin setup as completed
export async function markSetupCompleted(projectDir: string): Promise<void> {
  const dmapDir = path.join(projectDir, '.dmap');
  await mkdir(dmapDir, { recursive: true });
  await writeFile(path.join(dmapDir, 'setup-completed'), new Date().toISOString(), 'utf-8');
}
