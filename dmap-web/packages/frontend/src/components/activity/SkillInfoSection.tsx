import { useAppStore } from '../../stores/appStore.js';
import { useLangStore } from '../../stores/langStore.js';
import { useT } from '../../i18n/index.js';
import type { Translations } from '../../i18n/types.js';

export function SkillInfoSection() {
  const { selectedSkill, selectedPlugin } = useAppStore();
  const { lang } = useLangStore();
  const t = useT();

  if (!selectedSkill) return null;

  const items = [
    { label: t('activity.skillInfo.skill'), value: `${selectedSkill.icon} ${t(`skill.${selectedSkill.name}.name` as keyof Translations) || selectedSkill.displayName}` },
    { label: t('activity.skillInfo.plugin'), value: selectedPlugin?.displayNames?.[lang] || selectedPlugin?.name || '-' },
  ];

  return (
    <div className="px-4 py-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-400 dark:text-gray-500">{item.label}</span>
          <span className="text-base text-gray-600 dark:text-gray-300 truncate ml-2 max-w-[180px] text-right">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
