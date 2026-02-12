import { useEffect } from 'react';
import { useActivityStore } from '../stores/activityStore.js';
import { StatusHeader } from './activity/StatusHeader.js';
import { ProgressSection } from './activity/ProgressSection.js';
import { ToolSection } from './activity/ToolSection.js';
import { SkillInfoSection } from './activity/SkillInfoSection.js';
import { CollapsibleSection } from './activity/CollapsibleSection.js';
import { CompactRail } from './activity/CompactRail.js';
import { AgentSection } from './activity/AgentSection.js';
import { UsageFooter } from './activity/UsageFooter.js';
import { useAppStore } from '../stores/appStore.js';
import { useT } from '../i18n/index.js';

export function ActivityPanel() {
  const { panelMode, sectionStates, togglePanel, toggleSection, toolCounts, agentEvents } = useActivityStore();
  const { selectedSkill } = useAppStore();
  const t = useT();

  // Keyboard shortcut: Ctrl+Shift+A
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        togglePanel();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [togglePanel]);

  // Rail mode
  if (panelMode === 'rail') {
    return <CompactRail />;
  }

  // Expanded mode
  const totalTools = Object.values(toolCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="w-80 h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex-shrink-0">
      {/* Pinned header */}
      <StatusHeader />

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto activity-scroll min-h-0 p-3 flex flex-col gap-3">
        <CollapsibleSection
          id="progress"
          title={t('activity.progress')}
          expanded={sectionStates.progress ?? true}
          onToggle={() => toggleSection('progress')}
        >
          <ProgressSection />
        </CollapsibleSection>

        {selectedSkill && (
          <CollapsibleSection
            id="skillInfo"
            title={t('activity.skillInfo')}
            subtitle={selectedSkill.displayName}
            expanded={sectionStates.skillInfo ?? false}
            onToggle={() => toggleSection('skillInfo')}
          >
            <SkillInfoSection />
          </CollapsibleSection>
        )}

        <CollapsibleSection
          id="agents"
          title={t('activity.agents')}
          badge={agentEvents.length || undefined}
          expanded={sectionStates.agents ?? true}
          onToggle={() => toggleSection('agents')}
        >
          <AgentSection />
        </CollapsibleSection>

        <CollapsibleSection
          id="tools"
          title={t('activity.tools')}
          badge={totalTools || undefined}
          expanded={sectionStates.tools ?? false}
          onToggle={() => toggleSection('tools')}
        >
          <ToolSection />
        </CollapsibleSection>
      </div>

      {/* Pinned usage footer */}
      <UsageFooter />
    </div>
  );
}
