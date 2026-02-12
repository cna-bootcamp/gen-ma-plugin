import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore.js';
import { SkillCard } from './SkillCard.js';
import { SettingsMenu } from './SettingsMenu.js';
import { PluginSwitcher } from './PluginSwitcher.js';
import { AddPluginDialog } from './AddPluginDialog.js';
import { useT } from '../i18n/index.js';
import { useLangStore } from '../stores/langStore.js';
import { SKILL_CATEGORIES } from '@dmap-web/shared';
import type { SkillMeta } from '@dmap-web/shared';

export function Sidebar() {
  const { skills, selectedSkill, selectSkill, isStreaming, fetchSkills, plugins, selectedPlugin, fetchPlugins } = useAppStore();
  const { lang } = useLangStore();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const t = useT();

  useEffect(() => {
    fetchPlugins().then(() => fetchSkills());
  }, [fetchPlugins, fetchSkills]);

  const grouped = skills.reduce<Record<string, SkillMeta[]>>((acc, skill) => {
    const cat = skill.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  return (
    <aside className="w-full h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <PluginSwitcher disabled={isStreaming} />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAddDialog(true)}
              className="p-1.5 rounded-full border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t('plugin.add')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
            <SettingsMenu version={selectedPlugin?.version || ''} />
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
          {selectedPlugin?.description || t('sidebar.subtitle')}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {Object.entries(SKILL_CATEGORIES).map(([key, cat]) => {
          const categorySkills = grouped[key];
          if (!categorySkills?.length) return null;

          return (
            <div key={key}>
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 mb-2">
                {t(`category.${key}` as keyof import('../i18n/types.js').Translations) || cat.label}
              </h2>
              <div className="space-y-1">
                {categorySkills.map((skill) => (
                  <SkillCard
                    key={skill.name}
                    skill={skill}
                    isSelected={selectedSkill?.name === skill.name}
                    onClick={() => !isStreaming && selectSkill(skill)}
                    disabled={isStreaming}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-400 truncate">
        {selectedPlugin?.displayNames?.[lang] || selectedPlugin?.name || 'Plugin'} v{selectedPlugin?.version || '...'}
      </div>

      {showAddDialog && (
        <AddPluginDialog
          onClose={() => setShowAddDialog(false)}
          onAdded={() => setShowAddDialog(false)}
        />
      )}
    </aside>
  );
}
