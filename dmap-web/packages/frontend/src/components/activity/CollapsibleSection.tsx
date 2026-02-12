import { type ReactNode } from 'react';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  badge?: string | number;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function CollapsibleSection({ id, title, badge, subtitle, expanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-800 dark:text-gray-200">
            {title}
          </span>
          {badge !== undefined && (
            <span className="text-sm font-normal tabular-nums text-gray-400 dark:text-gray-500">
              {badge}
            </span>
          )}
        </div>
        {subtitle ? (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-40">
            {subtitle}
          </span>
        ) : (
          <svg
            className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      <div
        style={{ display: 'grid', gridTemplateRows: expanded ? '1fr' : '0fr', transition: 'grid-template-rows 200ms ease-out' }}
      >
        <div style={{ overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
