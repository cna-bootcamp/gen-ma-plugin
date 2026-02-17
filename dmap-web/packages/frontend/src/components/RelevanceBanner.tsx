/**
 * 스킬 관련성 불일치 배너 - 사용자 입력이 현재 스킬과 무관할 때 추천 표시
 *
 * 비차단(non-blocking): 배너 표시 중에도 모델 응답이 계속 스트리밍됨
 * 자동 닫힘 없음: 사용자가 명시적으로 닫거나 스킬 전환할 때만 제거
 *
 * @module components/RelevanceBanner
 */
import { useT } from '../i18n/index.js';

interface RelevanceBannerProps {
  suggestedSkillDisplayName: string;
  reason: string;
  isPromptMode: boolean;
  onSwitch: () => void;
  onDismiss: () => void;
}

export function RelevanceBanner({ suggestedSkillDisplayName, reason, isPromptMode, onSwitch, onDismiss }: RelevanceBannerProps) {
  const t = useT();

  const message = isPromptMode
    ? t('relevance.promptSuggestion')
    : t('relevance.suggestion').replace('{{skill}}', suggestedSkillDisplayName);

  return (
    <div className="mx-2 mb-3 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 flex items-center gap-3">
      <span className="text-amber-600 dark:text-amber-400 flex-shrink-0 text-sm">
        {message}
      </span>
      {reason && (
        <span className="text-xs text-amber-500 dark:text-amber-500 flex-shrink-0">
          ({reason})
        </span>
      )}
      <div className="flex-1" />
      <button
        onClick={onSwitch}
        className="px-3 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-colors flex-shrink-0"
      >
        {t('relevance.switch')}
      </button>
      <button
        onClick={onDismiss}
        className="p-1 text-amber-400 dark:text-amber-600 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex-shrink-0"
        aria-label={t('relevance.dismiss')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
