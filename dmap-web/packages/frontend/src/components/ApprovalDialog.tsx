import { useState } from 'react';
import { useT } from '../i18n/index.js';
import type { ApprovalOption } from '@dmap-web/shared';

interface ApprovalDialogProps {
  approval: {
    id: string;
    question: string;
    options: ApprovalOption[];
  };
  onRespond: (answer: string) => void;
}

export function ApprovalDialog({ approval, onRespond }: ApprovalDialogProps) {
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const t = useT();

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-amber-50 dark:bg-amber-900/10 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">{'\u{1F4AC}'}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('approval.title')}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{approval.question}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {approval.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => onRespond(option.label)}
              className="w-full text-left px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{option.label}</div>
              {option.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{option.description}</div>
              )}
            </button>
          ))}
        </div>

        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            {t('approval.customInput')}
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customInput.trim()) {
                  onRespond(customInput.trim());
                }
              }}
              placeholder={t('approval.customPlaceholder')}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={() => customInput.trim() && onRespond(customInput.trim())}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              {t('common.send')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
