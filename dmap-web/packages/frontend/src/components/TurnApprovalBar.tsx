import { useState } from 'react';
import { useT } from '../i18n/index.js';

interface TurnApprovalBarProps {
  question: string;
  onApprove: (message: string) => void;
  onReject: () => void;
}

export function TurnApprovalBar({ question, onApprove, onReject }: TurnApprovalBarProps) {
  const [feedbackValue, setFeedbackValue] = useState('');
  const t = useT();

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-6 py-4">
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{question}</p>

      {/* Approve / Reject buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onApprove(feedbackValue.trim() || t('approval.approve'))}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {t('approval.approve')}
        </button>
        <button
          onClick={onReject}
          className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {t('common.cancel')}
        </button>
      </div>

      {/* Feedback input */}
      <div className="relative">
        <input
          type="text"
          value={feedbackValue}
          onChange={(e) => setFeedbackValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && feedbackValue.trim()) {
              onApprove(feedbackValue.trim());
            }
          }}
          placeholder={t('approval.feedbackPlaceholder')}
          className="w-full px-4 py-2.5 pr-16 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {feedbackValue.trim() && (
          <button
            onClick={() => onApprove(feedbackValue.trim())}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
          >
            {t('common.send')}
          </button>
        )}
      </div>
    </div>
  );
}
