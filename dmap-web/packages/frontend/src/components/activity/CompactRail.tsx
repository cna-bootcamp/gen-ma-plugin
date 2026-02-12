import { useActivityStore } from '../../stores/activityStore.js';
import { useAppStore } from '../../stores/appStore.js';

export function CompactRail() {
  const { togglePanel, toolEvents, agentEvents, executionStartTime, executionEndTime } = useActivityStore();
  const { isStreaming } = useAppStore();

  const toolCount = toolEvents.length;

  // Determine status dot color
  let dotColor = 'bg-gray-400'; // idle
  if (isStreaming) {
    dotColor = 'bg-blue-500 animate-pulse'; // streaming
  } else if (executionEndTime && !isStreaming) {
    dotColor = 'bg-green-500'; // complete
  }

  return (
    <button
      onClick={togglePanel}
      className="w-14 h-full flex flex-col items-center py-5 gap-5 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
      aria-label="Expand activity panel"
    >
      {/* Status dot */}
      <div className={`w-3.5 h-3.5 rounded-full ${dotColor}`} />

      {/* Agent count */}
      {agentEvents.length > 0 && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400 tabular-nums">
            {agentEvents.length}
          </span>
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      )}

      {/* Tool count */}
      {toolCount > 0 && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400 tabular-nums">
            {toolCount}
          </span>
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z" />
          </svg>
        </div>
      )}

    </button>
  );
}
