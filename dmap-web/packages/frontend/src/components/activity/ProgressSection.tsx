import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../stores/appStore.js';
import { useActivityStore } from '../../stores/activityStore.js';
import { useT } from '../../i18n/index.js';

export function ProgressSection() {
  const { isStreaming, selectedSkill } = useAppStore(useShallow((s) => ({
    isStreaming: s.isStreaming,
    selectedSkill: s.selectedSkill,
  })));
  const { executionStartTime, executionEndTime, progressSteps } = useActivityStore(useShallow((s) => ({
    executionStartTime: s.executionStartTime,
    executionEndTime: s.executionEndTime,
    progressSteps: s.progressSteps,
  })));
  const t = useT();

  if (!selectedSkill) {
    return (
      <div className="px-4 py-3 text-base text-gray-400 dark:text-gray-500">
        {t('activity.progress.selectSkill')}
      </div>
    );
  }

  // Show step checklist if available
  if (progressSteps.length > 0) {
    return (
      <div className="px-4 py-2 flex flex-col gap-0.5">
        {progressSteps.map((step, i) => (
          <div key={step.step} className="flex items-start gap-3 py-1.5">
            {/* Step indicator */}
            <div className="flex-shrink-0 mt-0.5">
              {step.status === 'complete' ? (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : step.status === 'active' ? (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{step.step}</span>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{step.step}</span>
                </div>
              )}
            </div>
            {/* Step label */}
            <span className={`text-sm leading-6 ${
              step.status === 'complete' ? 'text-gray-600 dark:text-gray-300' :
              step.status === 'active' ? 'text-gray-800 dark:text-gray-200 font-medium' :
              'text-gray-400 dark:text-gray-500'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Fallback: simple status display
  if (isStreaming) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-base text-blue-600 dark:text-blue-400 font-medium">
            {t('activity.progress.inProgress')}
          </span>
        </div>
      </div>
    );
  }

  if (executionEndTime && executionStartTime) {
    const ms = new Date(executionEndTime).getTime() - new Date(executionStartTime).getTime();
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const remainSecs = secs % 60;
    const timeStr = mins > 0 ? `${mins}m ${remainSecs}s` : `${secs}s`;
    return (
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-base text-gray-600 dark:text-gray-300">
            {t('activity.progress.completedIn').replace('{{time}}', timeStr)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 text-base text-gray-400 dark:text-gray-500">
      {t('activity.progress.ready')}
    </div>
  );
}
