import { useT } from '../i18n/index.js';
import type { Translations } from '../i18n/types.js';
import type { SkillMeta } from '@dmap-web/shared';

interface Props {
  skill: SkillMeta;
  onClick: () => void;
  isSelected?: boolean;
  disabled?: boolean;
}

export function SkillCard({ skill, onClick, isSelected = false, disabled = false }: Props) {
  const t = useT();
  const nameKey = `skill.${skill.name}.name` as keyof Translations;
  const descKey = `skill.${skill.name}.desc` as keyof Translations;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group w-full text-left p-3 rounded-lg transition-all duration-150 ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
      } border ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{skill.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate dark:text-gray-100">{t(nameKey) || skill.displayName}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t(descKey) || skill.description}</p>
        </div>
      </div>
    </button>
  );
}
