import { useState } from 'react';
import { useT } from '../i18n/index.js';
import type { QuestionItem } from '@dmap-web/shared';

interface QuestionFormDialogProps {
  title: string;
  questions: QuestionItem[];
  onSubmit: (formatted: string) => void;
  onClose: () => void;
}

const CUSTOM_INPUT_PATTERNS = /직접\s*지정|직접\s*입력|기타|custom\s*input|other/i;
const CUSTOM_INPUT_KEY = '__custom__';

function filterOptions(options: string[]): string[] {
  return options.filter((opt) => !CUSTOM_INPUT_PATTERNS.test(opt));
}

export function QuestionFormDialog({ title, questions, onSubmit, onClose }: QuestionFormDialogProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    questions.forEach((q, i) => {
      if (q.suggestion) initial[i] = q.suggestion;
      else if (q.type === 'text' && q.example) initial[i] = q.example;
    });
    return initial;
  });
  const [customInputs, setCustomInputs] = useState<Record<number, string>>({});
  const t = useT();

  const handleSubmit = () => {
    const notFilled = t('question.notFilled');
    const formatted = questions
      .map((q, i) => {
        let answer = answers[i] || notFilled;
        if (answer === CUSTOM_INPUT_KEY) {
          answer = customInputs[i] || notFilled;
        } else if (answer.includes(CUSTOM_INPUT_KEY)) {
          const parts = answer.split(',').map((s) => s.trim()).filter((s) => s && s !== CUSTOM_INPUT_KEY);
          if (customInputs[i]) parts.push(customInputs[i]);
          answer = parts.join(', ') || notFilled;
        }
        return `${i + 1}. ${q.question}: ${answer}`;
      })
      .join('\n');
    onSubmit(formatted);
  };

  const current = questions[activeTab];
  const filledCount = questions.filter((_, i) => answers[i]?.trim()).length;

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-6 pt-4 pb-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {t('question.filled', { filled: filledCount, total: questions.length })}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 overflow-x-auto">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`flex-shrink-0 px-3 py-2 text-sm transition-colors ${
              activeTab === i
                ? 'border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-medium'
                : answers[i]?.trim()
                  ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {answers[i]?.trim() ? '\u2713 ' : ''}{i + 1}. {q.question.length > 12 ? q.question.slice(0, 12) + '...' : q.question}
          </button>
        ))}
      </div>

      {/* Active question content */}
      <div className="px-6 py-4">
        <div className="mb-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{current.question}</h4>
          {current.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-line">{current.description}</p>
          )}
        </div>

        {current.type === 'radio' && current.options ? (() => {
          const opts = filterOptions(current.options);
          const isCustom = answers[activeTab] === CUSTOM_INPUT_KEY;
          return (
            <div className="space-y-2">
              {opts.map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name={`q-${activeTab}`}
                    value={opt}
                    checked={!isCustom && answers[activeTab] === opt}
                    onChange={() => setAnswers({ ...answers, [activeTab]: opt })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">{opt}</span>
                </label>
              ))}
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name={`q-${activeTab}`}
                  value={CUSTOM_INPUT_KEY}
                  checked={isCustom}
                  onChange={() => setAnswers({ ...answers, [activeTab]: CUSTOM_INPUT_KEY })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">{t('question.customInput')}</span>
              </label>
              {isCustom && (
                <input
                  type="text"
                  value={customInputs[activeTab] || ''}
                  onChange={(e) => setCustomInputs({ ...customInputs, [activeTab]: e.target.value })}
                  placeholder={t('question.customPlaceholder')}
                  className="ml-6 w-[calc(100%-1.5rem)] px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              )}
            </div>
          );
        })() : current.type === 'checkbox' && current.options ? (() => {
          const opts = filterOptions(current.options);
          const selected = (answers[activeTab] || '').split(',').map((s) => s.trim()).filter((s) => s && s !== CUSTOM_INPUT_KEY);
          const hasCustom = (answers[activeTab] || '').includes(CUSTOM_INPUT_KEY);
          return (
            <div className="space-y-2">
              {opts.map((opt) => {
                const isChecked = selected.includes(opt);
                return (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      value={opt}
                      checked={isChecked}
                      onChange={() => {
                        const next = isChecked
                          ? selected.filter((s) => s !== opt)
                          : [...selected, opt];
                        const parts = hasCustom ? [...next, CUSTOM_INPUT_KEY] : next;
                        setAnswers({ ...answers, [activeTab]: parts.join(', ') });
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">{opt}</span>
                  </label>
                );
              })}
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={hasCustom}
                  onChange={() => {
                    const parts = hasCustom
                      ? selected
                      : [...selected, CUSTOM_INPUT_KEY];
                    setAnswers({ ...answers, [activeTab]: parts.join(', ') });
                    if (hasCustom) setCustomInputs({ ...customInputs, [activeTab]: '' });
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">{t('question.customInput')}</span>
              </label>
              {hasCustom && (
                <input
                  type="text"
                  value={customInputs[activeTab] || ''}
                  onChange={(e) => setCustomInputs({ ...customInputs, [activeTab]: e.target.value })}
                  placeholder={t('question.customPlaceholder')}
                  className="ml-6 w-[calc(100%-1.5rem)] px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              )}
            </div>
          );
        })() : (
          <textarea
            value={answers[activeTab] || ''}
            onChange={(e) => setAnswers({ ...answers, [activeTab]: e.target.value })}
            placeholder={current.example || t('question.inputPlaceholder', { question: current.question })}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            autoFocus
          />
        )}
      </div>

      {/* Actions */}
      <div className="px-6 pb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
            disabled={activeTab === 0}
            className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30"
          >
            {'\u2190'} {t('common.prev')}
          </button>
          <button
            onClick={() => setActiveTab(Math.min(questions.length - 1, activeTab + 1))}
            disabled={activeTab === questions.length - 1}
            className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30"
          >
            {t('common.next')} {'\u2192'}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('question.submit', { filled: filledCount, total: questions.length })}
          </button>
        </div>
      </div>
    </div>
  );
}
