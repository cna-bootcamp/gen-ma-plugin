import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage, QuestionItem } from '@dmap-web/shared';
import { useState } from 'react';

interface MessageBubbleProps {
  message: ChatMessage;
}

function parseAskUserBlock(content: string): { title: string; questions: QuestionItem[] } | null {
  const match = content.match(/<!--ASK_USER-->\s*(\{[\s\S]*?\})\s*<!--\/ASK_USER-->/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    return parsed;
  } catch {
    return null;
  }
}

function InlineQuestionForm({ data }: { data: { title: string; questions: QuestionItem[] } }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const CUSTOM_INPUT_KEY = '__custom__';

  const handleSubmit = () => {
    const formatted = data.questions
      .map((q, i) => {
        let answer = answers[i] || '(미응답)';
        if (answer === CUSTOM_INPUT_KEY) {
          answer = customInputs[i] || '(미응답)';
        } else if (answer.includes(CUSTOM_INPUT_KEY)) {
          const parts = answer.split(',').map((s) => s.trim()).filter((s) => s && s !== CUSTOM_INPUT_KEY);
          if (customInputs[i]) parts.push(customInputs[i]);
          answer = parts.join(', ') || '(미응답)';
        }
        return `${i + 1}. ${q.question}: ${answer}`;
      })
      .join('\n');

    navigator.clipboard.writeText(formatted);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 my-2">
        <div className="text-sm text-green-700 dark:text-green-300">✅ 응답이 클립보드에 복사되었습니다. 채팅창에 붙여넣기(Ctrl+V) 하세요.</div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 my-2">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{data.title}</h3>
      <div className="space-y-4">
        {data.questions.map((q, i) => (
          <div key={i} className="space-y-2">
            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">{i + 1}. {q.question}</h4>
            {q.description && <p className="text-xs text-gray-500 dark:text-gray-400">{q.description}</p>}

            {q.type === 'radio' && q.options ? (
              <div className="space-y-1">
                {q.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`q-${i}`}
                      value={opt}
                      checked={answers[i] === opt}
                      onChange={() => setAnswers({ ...answers, [i]: opt })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`q-${i}`}
                    value={CUSTOM_INPUT_KEY}
                    checked={answers[i] === CUSTOM_INPUT_KEY}
                    onChange={() => setAnswers({ ...answers, [i]: CUSTOM_INPUT_KEY })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">직접 입력</span>
                </label>
                {answers[i] === CUSTOM_INPUT_KEY && (
                  <input
                    type="text"
                    value={customInputs[i] || ''}
                    onChange={(e) => setCustomInputs({ ...customInputs, [i]: e.target.value })}
                    placeholder="직접 입력하세요"
                    className="ml-6 w-[calc(100%-1.5rem)] px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ) : q.type === 'checkbox' && q.options ? (
              <div className="space-y-1">
                {q.options.map((opt) => {
                  const selected = (answers[i] || '').split(',').map((s) => s.trim());
                  const isChecked = selected.includes(opt);
                  return (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const next = isChecked
                            ? selected.filter((s) => s !== opt)
                            : [...selected, opt];
                          setAnswers({ ...answers, [i]: next.join(', ') });
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                    </label>
                  );
                })}
                {(() => {
                  const hasCustom = (answers[i] || '').includes(CUSTOM_INPUT_KEY);
                  return (
                    <>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasCustom}
                          onChange={() => {
                            const selected = (answers[i] || '').split(',').map((s) => s.trim()).filter((s) => s && s !== CUSTOM_INPUT_KEY);
                            const parts = hasCustom ? selected : [...selected, CUSTOM_INPUT_KEY];
                            setAnswers({ ...answers, [i]: parts.join(', ') });
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">직접 입력</span>
                      </label>
                      {hasCustom && (
                        <input
                          type="text"
                          value={customInputs[i] || ''}
                          onChange={(e) => setCustomInputs({ ...customInputs, [i]: e.target.value })}
                          placeholder="직접 입력하세요"
                          className="ml-6 w-[calc(100%-1.5rem)] px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <input
                type="text"
                value={answers[i] || ''}
                onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                placeholder={q.example || q.suggestion || '답변을 입력하세요'}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        응답 복사
      </button>
    </div>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    const askUserData = parseAskUserBlock(message.content);

    if (askUserData) {
      return <InlineQuestionForm data={askUserData} />;
    }

    return (
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-1">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
        }`}
      >
        <div className={`prose prose-sm max-w-none dark:prose-invert ${isUser ? 'prose-invert' : ''}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
