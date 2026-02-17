/**
 * 플러그인 라우트 - 플러그인 CRUD + 에이전트 동기화 + 메뉴 관리 API
 *
 * 엔드포인트:
 * - GET /api/plugins: 전체 플러그인 목록 (setupCompleted 플래그 포함)
 * - POST /api/plugins: 새 플러그인 등록
 * - POST /api/plugins/validate: 플러그인 디렉토리 유효성 검증
 * - POST /api/plugins/:id/sync: 에이전트 동기화 (agents/ 디렉토리 스캔)
 * - GET/PUT /api/plugins/:id/menus: 메뉴 설정 조회/저장
 * - POST /api/plugins/:id/menus/ai-recommend: Claude AI 기반 메뉴 자동 분류
 * - DELETE /api/plugins/:id: 플러그인 삭제
 *
 * @module routes/plugins
 */
import { Router } from 'express';
import { getAllPlugins, addPlugin, removePlugin, validatePluginDir, resolveProjectDir, isSetupCompleted } from '../services/plugin-manager.js';
import { syncPluginAgents, removeRegisteredPlugin, getMenus, saveMenus, generateDefaultMenus, refreshExternalMenus } from '../services/agent-registry.js';
import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import type { MenuConfig, MenuSubcategory, MenuSkillItem } from '@dmap-web/shared';
import { createLogger } from '../utils/logger.js';

const log = createLogger('Plugins');

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

// POST /api/plugins/:id/sync - Sync plugin agents from local project
pluginsRouter.post('/:id/sync', async (req, res) => {
  try {
    const projectDir = await resolveProjectDir(req.params.id);
    const result = syncPluginAgents(req.params.id, projectDir);
    res.json({ success: true, count: result.count, agents: result.agents });
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/plugins/:id/menus - Get menu configuration
pluginsRouter.get('/:id/menus', async (req, res) => {
  try {
    const projectDir = await resolveProjectDir(req.params.id);
    const menus = getMenus(req.params.id, projectDir);
    res.json(menus);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /api/plugins/:id/menus - Save menu configuration
pluginsRouter.put('/:id/menus', async (req, res) => {
  try {
    const menus = req.body;
    if (!menus || !menus.core) {
      res.status(400).json({ error: 'Invalid menu configuration' });
      return;
    }
    saveMenus(req.params.id, menus);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/plugins/:id/menus/refresh - 외부 플러그인 메뉴 갱신 (ext-skill 추가/삭제 후 호출)
pluginsRouter.post('/:id/menus/refresh', async (req, res) => {
  try {
    const pluginId = req.params.id;
    const projectDir = await resolveProjectDir(pluginId);
    const menus = refreshExternalMenus(pluginId, projectDir);
    res.json(menus);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/plugins/:id/menus/ai-recommend - AI-powered menu classification
pluginsRouter.post('/:id/menus/ai-recommend', async (req, res) => {
  try {
    const pluginId = req.params.id;
    const { lang: userLang } = req.body as { lang?: string };
    const projectDir = await resolveProjectDir(pluginId);

    // 1. Read all SKILL.md files to build skill info for Claude
    const skillsDir = path.join(projectDir, 'skills');
    if (!existsSync(skillsDir)) {
      res.json(generateDefaultMenus(projectDir));
      return;
    }

    const UTILITY_SKILLS = new Set(['setup', 'add-ext-skill', 'remove-ext-skill', 'help']);
    const CORE_TYPES = new Set(['core', 'planning', 'orchestrator']);

    interface SkillInfo {
      name: string;
      type: string;
      description: string;
      koName: string;
      enName: string;
    }

    const coreSkills: SkillInfo[] = [];
    const utilitySkills: SkillInfo[] = [];
    const externalSkills: SkillInfo[] = [];

    const dirs = readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && existsSync(path.join(skillsDir, d.name, 'SKILL.md')));

    for (const dir of dirs) {
      if (dir.name === 'core') continue;
      const skillMdPath = path.join(skillsDir, dir.name, 'SKILL.md');
      const content = readFileSync(skillMdPath, 'utf-8').replace(/\r\n/g, '\n');

      // Parse frontmatter
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      let fmType = '';
      let description = '';
      let koName = dir.name;
      let enName = dir.name;

      if (fmMatch) {
        const yaml = fmMatch[1];
        const typeMatch = yaml.match(/^type:\s*(.+)$/m);
        const descMatch = yaml.match(/^description:\s*(.+)$/m);
        if (typeMatch) fmType = typeMatch[1].trim().replace(/^['"]|['"]$/g, '');
        if (descMatch) description = descMatch[1].trim().replace(/^['"]|['"]$/g, '');

        // Skip non-user-invocable skills
        const uiMatch = yaml.match(/^user-invocable:\s*(.+)$/m);
        if (uiMatch && uiMatch[1].trim() === 'false') continue;

        // Parse i18n
        const i18nKoNameMatch = yaml.match(/ko:\s*\n\s+name:\s*(.+)/);
        const i18nEnNameMatch = yaml.match(/en:\s*\n\s+name:\s*(.+)/);
        if (i18nKoNameMatch) koName = i18nKoNameMatch[1].trim().replace(/^['"]|['"]$/g, '');
        if (i18nEnNameMatch) enName = i18nEnNameMatch[1].trim().replace(/^['"]|['"]$/g, '');
      }

      // Extract description section from body (after frontmatter)
      const bodyStart = fmMatch ? (fmMatch.index || 0) + fmMatch[0].length : 0;
      const body = content.slice(bodyStart).trim();
      // Get first meaningful paragraph as extended description
      const firstParagraph = body.split('\n\n').find(p => p.trim() && !p.startsWith('#'));
      const extDesc = firstParagraph?.trim() || '';

      const info: SkillInfo = {
        name: dir.name,
        type: fmType,
        description: description || extDesc || dir.name,
        koName,
        enName,
      };

      const isExt = dir.name.startsWith('ext-');
      if (UTILITY_SKILLS.has(dir.name)) {
        utilitySkills.push(info);
      } else if (isExt || fmType === 'external') {
        externalSkills.push(info);
      } else if (CORE_TYPES.has(fmType) || !fmType) {
        coreSkills.push(info);
      } else if (fmType === 'utility' || fmType === 'setup') {
        utilitySkills.push(info);
      } else {
        coreSkills.push(info);
      }
    }

    // utility/external은 규칙 기반 분류 (AI 불필요) - 고정 순서 보장
    const UTILITY_ORDER = ['setup', 'add-ext-skill', 'remove-ext-skill', 'help'];
    const utility: MenuSkillItem[] = [];
    for (const name of UTILITY_ORDER) {
      const found = utilitySkills.find(s => s.name === name);
      if (found) utility.push({ name: found.name, labels: { ko: found.koName, en: found.enName } });
    }
    // Any other utility skills not in fixed order
    for (const s of utilitySkills) {
      if (!UTILITY_ORDER.includes(s.name)) {
        utility.push({ name: s.name, labels: { ko: s.koName, en: s.enName } });
      }
    }

    const external: MenuSkillItem[] = externalSkills
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(s => ({ name: s.name, labels: { ko: s.koName, en: s.enName } }));

    // 3. If only 0-1 core skills, no need for AI classification
    if (coreSkills.length <= 1) {
      const core: MenuSubcategory[] = coreSkills.length === 1
        ? [{ id: 'default', labels: { ko: '기본', en: 'Default' }, skills: [{ name: coreSkills[0].name, labels: { ko: coreSkills[0].koName, en: coreSkills[0].enName } }] }]
        : [];
      res.json({ core, utility, external });
      return;
    }

    // Claude SDK로 core 스킬을 의미 기반 하위 카테고리로 자동 분류 요청
    const skillListForAi = coreSkills.map(s =>
      `- name: "${s.name}", type: "${s.type}", description: "${s.description}"`
    ).join('\n');

    const aiPrompt = `You are a menu classification expert. Given the following plugin skills, group them into subcategories based on their purpose/use-case.

SKILLS:
${skillListForAi}

RULES:
1. Group skills by their purpose/use-case (e.g., "탐색" for exploration/analysis, "개발" for development/implementation)
2. Each subcategory must have at least 2 skills. If only 1 skill would be in a group, merge it with the most related group.
3. Provide Korean (ko) and English (en) names for each subcategory. Names should be short nouns (1-2 words).
4. Provide Korean (ko) and English (en) display names for each skill. Names should be short nouns based on the skill's description.
5. Return ONLY valid JSON, no markdown code fences, no explanation.

RESPONSE FORMAT (JSON only):
{
  "subcategories": [
    {
      "id": "unique-id",
      "labels": { "ko": "한글명", "en": "English Name" },
      "skills": [
        { "name": "skill-name", "labels": { "ko": "한글명", "en": "English Name" } }
      ]
    }
  ]
}`;

    log.info(`AI recommend: classifying ${coreSkills.length} core skills for plugin ${pluginId}`);

    try {
      const { query } = await import('@anthropic-ai/claude-code');
      let aiText = '';

      const conversation = query({
        prompt: aiPrompt,
        options: {
          model: 'claude-sonnet-4-5-20250929',
          maxTurns: 1,
          systemPrompt: 'You are a JSON-only responder. Return only valid JSON without any markdown formatting or explanation.',
          permissionMode: 'bypassPermissions' as const,
        },
      });

      for await (const msg of conversation) {
        const message = msg as Record<string, unknown>;
        // Collect text from assistant messages
        if (message.type === 'assistant' && message.message) {
          const m = message.message as { content?: Array<{ type: string; text?: string }> };
          if (m.content) {
            for (const block of m.content) {
              if (block.type === 'text' && block.text) aiText += block.text;
            }
          }
        }
        // Collect text from result message
        if (message.type === 'result') {
          const content = message.content as Array<{ type: string; text?: string }> | undefined;
          if (content) {
            for (const block of content) {
              if (block.type === 'text' && block.text) aiText += block.text;
            }
          }
        }
      }

      // Parse JSON from AI response (strip markdown fences if present)
      const jsonStr = aiText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(jsonStr) as { subcategories: Array<{ id: string; labels: { ko: string; en: string }; skills: MenuSkillItem[] }> };

      const core: MenuSubcategory[] = parsed.subcategories.map(sub => ({
        id: sub.id,
        labels: sub.labels,
        skills: sub.skills,
      }));

      log.info(`AI recommend: created ${core.length} subcategories for ${pluginId}`);
      res.json({ core, utility, external });
    } catch (aiError) {
      // AI 분류 실패 시 단일 "기본" 카테고리로 폴백
      log.warn('AI recommend failed, using default menu:', aiError);
      const core: MenuSubcategory[] = [{
        id: 'default',
        labels: { ko: '기본', en: 'Default' },
        skills: coreSkills.map(s => ({ name: s.name, labels: { ko: s.koName, en: s.enName } })),
      }];
      res.json({ core, utility, external });
    }
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE /api/plugins/:id - Remove a plugin
pluginsRouter.delete('/:id', async (req, res) => {
  try {
    await removePlugin(req.params.id);
    // Auto-remove registered agents
    try { removeRegisteredPlugin(req.params.id); } catch { /* ignore */ }
    res.json({ success: true });
  } catch (error: unknown) {
    const msg = (error as Error).message;
    const status = msg === 'cannot_remove_default' ? 403 : 404;
    res.status(status).json({ error: msg });
  }
});
